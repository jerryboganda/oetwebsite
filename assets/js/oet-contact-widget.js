(function () {
    'use strict';

    function initOetContactWidget() {
        if (!document.body || !document.body.classList.contains('oet-live-site')) {
            return;
        }

        if (document.getElementById('oet-contact-widget')) {
            return;
        }

        var STORAGE_KEY = 'oetContactWidgetState';
        var SEND_ENDPOINT = '/oet-chat-send.php';
        var SYNC_ENDPOINT = '/oet-chat-sync.php';
        var SYNC_INTERVAL_MS = 25000;
        var AUTO_HIDE_TOAST_MS = 6000;
        var SUPPORT = {
            phoneHref: 'tel:+447961725989',
            phoneText: '+44 7961 725989',
            emailHref: 'mailto:support@oetwithdrhesham.co.uk',
            emailText: 'support@oetwithdrhesham.co.uk',
            whatsappHref: 'https://wa.me/447961725989',
            telegramHref: 'https://t.me/Oet_with_Hesham'
        };

        function defaultState() {
            return {
                threadRef: '',
                accessToken: '',
                hasOpenedWidget: false,
                visitor: {
                    name: '',
                    email: ''
                },
                messages: [],
                lastSeenAt: '',
                unreadCount: 0,
                lastSyncAt: ''
            };
        }

        function loadState() {
            try {
                var raw = window.localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    return defaultState();
                }

                var parsed = JSON.parse(raw);
                var fallback = defaultState();

                return {
                    threadRef: typeof parsed.threadRef === 'string' ? parsed.threadRef : fallback.threadRef,
                    accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : fallback.accessToken,
                    hasOpenedWidget: Boolean(parsed.hasOpenedWidget),
                    visitor: {
                        name: parsed.visitor && typeof parsed.visitor.name === 'string' ? parsed.visitor.name : fallback.visitor.name,
                        email: parsed.visitor && typeof parsed.visitor.email === 'string' ? parsed.visitor.email : fallback.visitor.email
                    },
                    messages: Array.isArray(parsed.messages) ? parsed.messages : fallback.messages,
                    lastSeenAt: typeof parsed.lastSeenAt === 'string' ? parsed.lastSeenAt : fallback.lastSeenAt,
                    unreadCount: Number.isFinite(parsed.unreadCount) ? parsed.unreadCount : fallback.unreadCount,
                    lastSyncAt: typeof parsed.lastSyncAt === 'string' ? parsed.lastSyncAt : fallback.lastSyncAt
                };
            } catch (error) {
                return defaultState();
            }
        }

        var state = loadState();
        var root;
        var launcherButton;
        var launcherLabel;
        var launcherIcon;
        var badgeEl;
        var panelEl;
        var messagesEl;
        var bodyEl;
        var chatEl;
        var nameInput;
        var emailInput;
        var messageInput;
        var sendButton;
        var toastEl;
        var chatActionButton;
        var syncTimer = null;
        var toastTimer = null;
        var attentionTimeline = null;
        var attentionTweens = [];
        var isOpen = false;
        var isChatOpen = false;
        var isSending = false;

        function saveState() {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (error) {
                // Ignore storage failures so the widget stays usable.
            }
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function formatTime(isoString) {
            var date = new Date(isoString);
            if (Number.isNaN(date.getTime())) {
                return '';
            }

            try {
                return new Intl.DateTimeFormat([], {
                    hour: 'numeric',
                    minute: '2-digit'
                }).format(date);
            } catch (error) {
                return date.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                });
            }
        }

        function latestAgentTimestamp(messages) {
            var latest = 0;
            messages.forEach(function (message) {
                if (message.role !== 'agent') {
                    return;
                }

                var time = Date.parse(message.created_at || '');
                if (!Number.isNaN(time)) {
                    latest = Math.max(latest, time);
                }
            });
            return latest;
        }

        function unreadAgentCount(messages, lastSeenAt) {
            var boundary = Date.parse(lastSeenAt || '');
            if (Number.isNaN(boundary)) {
                boundary = 0;
            }

            return messages.reduce(function (count, message) {
                if (message.role !== 'agent') {
                    return count;
                }

                var time = Date.parse(message.created_at || '');
                if (!Number.isNaN(time) && time > boundary) {
                    return count + 1;
                }

                return count;
            }, 0);
        }

        function updateBadge() {
            if (!badgeEl) {
                return;
            }

            var unread = state.unreadCount || 0;
            var showTeaser = !state.hasOpenedWidget && !unread;
            if (!unread && !showTeaser) {
                badgeEl.hidden = true;
                badgeEl.textContent = '';
                badgeEl.classList.remove('is-teaser');
                return;
            }

            badgeEl.hidden = false;
            badgeEl.classList.toggle('is-teaser', showTeaser);
            badgeEl.textContent = showTeaser ? '1' : (unread > 9 ? '9+' : String(unread));
        }

        function renderMessages() {
            if (!messagesEl) {
                return;
            }

            messagesEl.innerHTML = '';

            if (!state.messages.length) {
                var empty = document.createElement('div');
                empty.className = 'oet-contact-widget__empty';
                empty.textContent = 'Tell us your name and message to start a live chat. Replies appear here once the support team responds.';
                messagesEl.appendChild(empty);
                updateBadge();
                return;
            }

            state.messages.forEach(function (message) {
                var bubble = document.createElement('div');
                bubble.className = 'oet-contact-widget__message oet-contact-widget__message--' + (message.role === 'agent' ? 'agent' : 'user');

                var name = message.role === 'agent' ? (message.name || 'OET Support') : (message.name || 'You');
                var text = escapeHtml(message.text || '');
                var time = formatTime(message.created_at || '');

                bubble.innerHTML = ''
                    + '<span class="oet-contact-widget__message-name">' + escapeHtml(name) + '</span>'
                    + '<span class="oet-contact-widget__message-text">' + text.replace(/\n/g, '<br>') + '</span>'
                    + '<span class="oet-contact-widget__message-meta">' + escapeHtml(time) + '</span>';

                messagesEl.appendChild(bubble);
            });

            messagesEl.scrollTop = messagesEl.scrollHeight;
            updateBadge();
        }

        function startAttentionAnimation() {
            var reduceMotion = !!(window.matchMedia && (
                window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                window.matchMedia('(max-width: 1023.98px)').matches ||
                window.matchMedia('(pointer: coarse)').matches
            ));
            if (reduceMotion || !window.gsap || !launcherButton || !launcherLabel || isOpen) {
                return;
            }

            if (attentionTimeline || attentionTweens.length) {
                return;
            }

            root.classList.add('has-gsap');
            window.gsap.set([launcherButton, launcherLabel, launcherIcon, badgeEl].filter(Boolean), {
                transformOrigin: '50% 50%'
            });

            attentionTweens.push(window.gsap.to(launcherButton, {
                y: -12,
                scale: 1.045,
                duration: 0.28,
                ease: 'power2.out',
                repeat: -1,
                yoyo: true,
                repeatDelay: 0.45
            }));

            attentionTweens.push(window.gsap.to(launcherLabel, {
                x: -3,
                y: -4,
                rotation: -1.8,
                duration: 0.26,
                ease: 'power2.out',
                repeat: -1,
                yoyo: true,
                repeatDelay: 0.45,
                delay: 0.06
            }));

            attentionTweens.push(window.gsap.to(launcherIcon, {
                scale: 1.14,
                rotation: -10,
                duration: 0.26,
                ease: 'power2.out',
                repeat: -1,
                yoyo: true,
                repeatDelay: 0.45,
                delay: 0.06
            }));

            if (badgeEl && !badgeEl.hidden) {
                attentionTweens.push(window.gsap.to(badgeEl, {
                    y: -8,
                    scale: 1.18,
                    rotation: -6,
                    duration: 0.2,
                    ease: 'power2.out',
                    repeat: -1,
                    yoyo: true,
                    repeatDelay: 0.45,
                    delay: 0.12
                }));
            }
        }

        function stopAttentionAnimation() {
            if (attentionTimeline) {
                attentionTimeline.kill();
                attentionTimeline = null;
            }

            while (attentionTweens.length) {
                var tween = attentionTweens.pop();
                if (tween && typeof tween.kill === 'function') {
                    tween.kill();
                }
            }

            if (window.gsap) {
                window.gsap.set([launcherButton, launcherLabel, launcherIcon, badgeEl].filter(Boolean), {
                    clearProps: 'transform'
                });
            }

            if (root) {
                root.classList.remove('has-gsap');
            }
        }

        function setToast(message, type) {
            if (!toastEl) {
                return;
            }

            window.clearTimeout(toastTimer);
            if (!message) {
                hideToast();
                return;
            }

            toastEl.hidden = false;
            toastEl.textContent = message;
            toastEl.className = 'oet-contact-widget__toast is-visible oet-contact-widget__toast--' + (type || 'info');
            toastTimer = window.setTimeout(function () {
                hideToast();
            }, AUTO_HIDE_TOAST_MS);
        }

        function hideToast() {
            if (!toastEl) {
                return;
            }

            toastEl.hidden = true;
            toastEl.textContent = '';
            toastEl.className = 'oet-contact-widget__toast';
        }

        function syncVisitorInputs() {
            if (nameInput && state.visitor.name) {
                nameInput.value = state.visitor.name;
            }

            if (emailInput && state.visitor.email) {
                emailInput.value = state.visitor.email;
            }
        }

        function setVisitorState(visitor) {
            state.visitor = {
                name: visitor.name || '',
                email: visitor.email || ''
            };
            saveState();
        }

        function renderStateFromMessages() {
            renderMessages();
            if (isOpen) {
                state.unreadCount = 0;
                state.lastSeenAt = new Date().toISOString();
            } else {
                state.unreadCount = unreadAgentCount(state.messages, state.lastSeenAt);
            }
            saveState();
            updateBadge();
        }

        function mergeThreadPayload(payload) {
            if (!payload) {
                return;
            }

            if (payload.thread_ref) {
                state.threadRef = payload.thread_ref;
            }

            if (payload.access_token) {
                state.accessToken = payload.access_token;
            }

            if (payload.visitor) {
                setVisitorState({
                    name: payload.visitor.name || state.visitor.name,
                    email: payload.visitor.email || state.visitor.email
                });
            }

            if (Array.isArray(payload.messages)) {
                state.messages = payload.messages;
            }

            if (payload.last_sync_at) {
                state.lastSyncAt = payload.last_sync_at;
            }
        }

        function startSyncTimer() {
            if (syncTimer) {
                return;
            }

            var scheduleNext = function (delay) {
                syncTimer = window.setTimeout(function () {
                    syncTimer = null;

                    if (!isOpen) {
                        return;
                    }

                    if (!state.threadRef || document.visibilityState === 'hidden' || isSending) {
                        scheduleNext(delay);
                        return;
                    }

                    var before = state.messages.length;
                    Promise.resolve(syncThread(false)).then(function () {
                        // idle backoff: stretch 25s -> 50s -> 100s (cap 120s) while nothing new arrives
                        var next = state.messages.length > before
                            ? SYNC_INTERVAL_MS
                            : Math.min(delay * 2, 120000);
                        scheduleNext(next);
                    });
                }, delay);
            };

            scheduleNext(SYNC_INTERVAL_MS);
        }

        function stopSyncTimer() {
            if (!syncTimer) {
                return;
            }

            window.clearTimeout(syncTimer);
            syncTimer = null;
        }

        function setOpen(nextOpen) {
            isOpen = Boolean(nextOpen);
            root.classList.toggle('is-open', isOpen);
            launcherButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            panelEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            launcherIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-comments';

            if (isOpen) {
                stopAttentionAnimation();
                state.hasOpenedWidget = true;
                state.unreadCount = 0;
                if (state.messages.length) {
                    state.lastSeenAt = new Date(latestAgentTimestamp(state.messages) || Date.now()).toISOString();
                } else {
                    state.lastSeenAt = new Date().toISOString();
                }
                saveState();
                updateBadge();
                if (bodyEl) {
                    bodyEl.scrollTop = 0;
                }
                if (messagesEl) {
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                }
                startSyncTimer();
                syncThread(true);
            } else {
                stopSyncTimer();
                setChatOpen(false);
                startAttentionAnimation();
            }
        }

        function toggleWidget() {
            setOpen(!isOpen);
        }

        function setChatOpen(nextOpen) {
            isChatOpen = Boolean(nextOpen);
            root.classList.toggle('is-chat-open', isChatOpen);
            if (chatActionButton) {
                chatActionButton.setAttribute('aria-expanded', isChatOpen ? 'true' : 'false');
            }
            if (chatEl) {
                chatEl.hidden = !isChatOpen;
            }
            if (bodyEl) {
                bodyEl.classList.toggle('is-chat-open', isChatOpen);
                bodyEl.scrollTop = 0;
            }

            if (isChatOpen) {
                window.setTimeout(function () {
                    if (messageInput) {
                        try {
                            messageInput.focus({ preventScroll: true });
                        } catch (error) {
                            messageInput.focus();
                        }
                    }
                }, 40);
            }
        }

        function toggleChatSection() {
            if (!isOpen) {
                setOpen(true);
            }

            setChatOpen(true);
            if (isChatOpen) {
                syncThread(false);
            }
        }

        function ensureThreadRef() {
            if (state.threadRef) {
                return state.threadRef;
            }

            state.threadRef = 'OETCHAT-' + Math.random().toString(36).slice(2, 10).toUpperCase();
            saveState();
            return state.threadRef;
        }

        function syncThread(showHint) {
            if (!state.threadRef) {
                return Promise.resolve();
            }

            var formData = new FormData();
            formData.append('thread_ref', state.threadRef);
            formData.append('access_token', state.accessToken || '');

            return fetch(SYNC_ENDPOINT, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                cache: 'no-store'
            }).then(function (response) {
                return response.json().catch(function () {
                    return null;
                });
            }).then(function (payload) {
                if (!payload || payload.ok === false) {
                    return;
                }

                if (payload.available === false) {
                    if (showHint) {
                        setToast('Live chat sync will activate once the mailbox credentials are added.', 'info');
                    }
                    return;
                }

                if (payload.thread) {
                    mergeThreadPayload(payload.thread);
                    if (isOpen) {
                        state.unreadCount = 0;
                        state.lastSeenAt = new Date().toISOString();
                    } else {
                        state.unreadCount = unreadAgentCount(state.messages, state.lastSeenAt);
                    }
                    saveState();
                    syncVisitorInputs();
                    renderMessages();
                }
            }).catch(function () {
                if (showHint) {
                    setToast('We could not refresh the chat right now.', 'error');
                }
            });
        }

        function sendMessage(event) {
            event.preventDefault();

            if (isSending) {
                return;
            }

            hideToast();

            var visitor = {
                name: nameInput ? nameInput.value.trim() : '',
                email: emailInput ? emailInput.value.trim() : ''
            };
            var messageText = messageInput ? messageInput.value.trim() : '';

            if (!visitor.name || !visitor.email || !messageText) {
                setToast('Please add your name, email, and message.', 'error');
                return;
            }

            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(visitor.email)) {
                setToast('Please enter a valid email address.', 'error');
                return;
            }

            isSending = true;
            sendButton.disabled = true;
            sendButton.dataset.originalText = sendButton.dataset.originalText || sendButton.innerHTML;
            sendButton.innerHTML = 'Sending... <i class="fa-solid fa-circle-notch fa-spin"></i>';

            var formData = new FormData();
            formData.append('thread_ref', ensureThreadRef());
            formData.append('access_token', state.accessToken || '');
            formData.append('name', visitor.name);
            formData.append('email', visitor.email);
            formData.append('phone', '');
            formData.append('message', messageText);
            formData.append('company', '');

            fetch(SEND_ENDPOINT, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                cache: 'no-store'
            }).then(function (response) {
                return response.json().then(function (payload) {
                    return {
                        ok: response.ok,
                        payload: payload
                    };
                }).catch(function () {
                    return {
                        ok: response.ok,
                        payload: null
                    };
                });
            }).then(function (result) {
                if (!result || !result.ok || !result.payload || result.payload.ok === false) {
                    var errorMessage = 'We could not send your message right now. Please try again.';
                    if (result && result.payload && result.payload.message) {
                        errorMessage = result.payload.message;
                    }
                    setToast(errorMessage, 'error');
                    return;
                }

                state.threadRef = result.payload.thread_ref || state.threadRef;
                    if (result.payload.access_token) {
                        state.accessToken = result.payload.access_token;
                    }
                setVisitorState(visitor);
                if (result.payload.thread && Array.isArray(result.payload.thread.messages)) {
                    state.messages = result.payload.thread.messages;
                } else {
                    state.messages = state.messages.concat([{
                        id: state.messages.length + 1,
                        role: 'user',
                        name: visitor.name,
                        email: visitor.email,
                        phone: '',
                        text: messageText,
                        source: 'website',
                        created_at: new Date().toISOString()
                    }]);
                }

                messageInput.value = '';
                state.unreadCount = 0;
                state.lastSeenAt = new Date().toISOString();
                saveState();
                renderStateFromMessages();
                setToast(result.payload.message || 'Your message has been sent.', 'success');
                syncThread(true);
            }).catch(function () {
                setToast('We could not send your message right now. Please try again.', 'error');
            }).finally(function () {
                isSending = false;
                sendButton.disabled = false;
                sendButton.innerHTML = sendButton.dataset.originalText || 'Send message <i class="fa-solid fa-paper-plane"></i>';
            });
        }

        function focusChatComposer() {
            if (!isChatOpen) {
                toggleChatSection();
                return;
            }

            if (!isOpen) {
                setOpen(true);
            }

            window.setTimeout(function () {
                if (messageInput) {
                    try {
                        messageInput.focus({ preventScroll: true });
                    } catch (error) {
                        messageInput.focus();
                    }
                }
            }, 30);
        }

        function buildWidget() {
            root = document.createElement('div');
            root.id = 'oet-contact-widget';
            root.className = 'oet-contact-widget';
            root.innerHTML = ''
                + '<button type="button" class="oet-contact-widget__launcher" aria-expanded="false" aria-controls="oet-contact-widget-panel">'
                + '  <span class="oet-contact-widget__label">Contact us</span>'
                + '  <span class="oet-contact-widget__button" aria-hidden="true">'
                + '    <i class="fa-solid fa-comments" data-oet-widget-icon></i>'
                + '    <span class="oet-contact-widget__badge" hidden>1</span>'
                + '  </span>'
                + '</button>'
                + '<section id="oet-contact-widget-panel" class="oet-contact-widget__panel" aria-hidden="true">'
                + '  <div class="oet-contact-widget__header">'
                + '    <button type="button" class="oet-contact-widget__close" aria-label="Close contact widget"><i class="fa-solid fa-xmark"></i></button>'
                + '    <p class="oet-contact-widget__eyebrow">OET support</p>'
                + '    <h3 class="oet-contact-widget__title">Talk to Dr Hesham\'s team</h3>'
                + '    <p class="oet-contact-widget__subtitle">Choose the fastest way to reach the OET support team. Call, email, WhatsApp, or Telegram are available.</p>'
                + '  </div>'
                + '  <div class="oet-contact-widget__body">'
                + '    <div class="oet-contact-widget__actions">'
                + '      <a class="oet-contact-widget__action oet-contact-widget__action--call" href="' + SUPPORT.phoneHref + '">'
                + '        <span class="oet-contact-widget__action-icon"><i class="fa-solid fa-phone"></i></span>'
                + '        <span class="oet-contact-widget__action-copy"><strong>Call</strong><small>' + SUPPORT.phoneText + '</small></span>'
                + '      </a>'
                + '      <a class="oet-contact-widget__action oet-contact-widget__action--email" href="' + SUPPORT.emailHref + '">'
                + '        <span class="oet-contact-widget__action-icon"><i class="fa-regular fa-envelope"></i></span>'
                + '        <span class="oet-contact-widget__action-copy"><strong>Email</strong><small>' + SUPPORT.emailText + '</small></span>'
                + '      </a>'
                + '      <a class="oet-contact-widget__action oet-contact-widget__action--whatsapp" href="' + SUPPORT.whatsappHref + '" target="_blank" rel="noopener noreferrer">'
                + '        <span class="oet-contact-widget__action-icon"><i class="fa-brands fa-whatsapp"></i></span>'
                + '        <span class="oet-contact-widget__action-copy"><strong>WhatsApp</strong><small>Instant support chat</small></span>'
                + '      </a>'
                + '      <a class="oet-contact-widget__action oet-contact-widget__action--telegram" href="' + SUPPORT.telegramHref + '" target="_blank" rel="noopener noreferrer">'
                + '        <span class="oet-contact-widget__action-icon"><i class="fa-brands fa-telegram"></i></span>'
                + '        <span class="oet-contact-widget__action-copy"><strong>Telegram</strong><small>Telegram materials</small></span>'
                + '      </a>'
                + '    </div>'
                + '    <div id="oet-contact-widget-chat" class="oet-contact-widget__chat" hidden>'
                + '      <div class="oet-contact-widget__chat-head">'
                + '        <button type="button" class="oet-contact-widget__back" aria-label="Back to contact options"><i class="fa-solid fa-arrow-left"></i><span>Back</span></button>'
                + '        <div class="oet-contact-widget__chat-head-copy">'
                + '          <div class="oet-contact-widget__chat-title">Live chat</div>'
                + '          <p class="oet-contact-widget__chat-copy">Message the OET support team here and keep the conversation in one place.</p>'
                + '        </div>'
                + '      </div>'
                + '      <div class="oet-contact-widget__messages" aria-live="polite"></div>'
                + '      <form class="oet-contact-widget__composer" novalidate>'
                + '        <div class="oet-contact-widget__fields">'
                + '          <label class="oet-contact-widget__field">'
                + '            <span>Your name</span>'
                + '            <input type="text" name="name" autocomplete="name" placeholder="Your full name" required>'
                + '          </label>'
                + '          <label class="oet-contact-widget__field">'
                + '            <span>Your email</span>'
                + '            <input type="email" name="email" autocomplete="email" placeholder="you@example.com" required>'
                + '          </label>'
                + '          <label class="oet-contact-widget__field oet-contact-widget__field--full">'
                + '            <span>Your message</span>'
                + '            <textarea name="message" rows="4" placeholder="Tell us what you need help with..." required></textarea>'
                + '          </label>'
                + '          <input type="text" name="company" class="oet-contact-widget__honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">'
                + '        </div>'
                + '        <button type="submit" class="oet-contact-widget__send">Send message <i class="fa-solid fa-paper-plane"></i></button>'
                + '        <p class="oet-contact-widget__hint">Replies appear here once the OET support team responds.</p>'
                + '        <div class="oet-contact-widget__toast" hidden></div>'
                + '      </form>'
                + '    </div>'
                + '  </div>'
                + '</section>';

            document.body.appendChild(root);

            launcherButton = root.querySelector('.oet-contact-widget__launcher');
            launcherLabel = root.querySelector('.oet-contact-widget__label');
            launcherIcon = root.querySelector('[data-oet-widget-icon]');
            badgeEl = root.querySelector('.oet-contact-widget__badge');
            panelEl = root.querySelector('.oet-contact-widget__panel');
            messagesEl = root.querySelector('.oet-contact-widget__messages');
            bodyEl = root.querySelector('.oet-contact-widget__body');
            chatEl = root.querySelector('.oet-contact-widget__chat');
            nameInput = root.querySelector('input[name="name"]');
            emailInput = root.querySelector('input[name="email"]');
            messageInput = root.querySelector('textarea[name="message"]');
            sendButton = root.querySelector('.oet-contact-widget__send');
            toastEl = root.querySelector('.oet-contact-widget__toast');
            chatActionButton = root.querySelector('.oet-contact-widget__action--chat');
            var backButton = root.querySelector('.oet-contact-widget__back');

            launcherButton.addEventListener('click', toggleWidget);
            root.querySelector('.oet-contact-widget__close').addEventListener('click', function () {
                setOpen(false);
            });
            if (chatActionButton) {
                chatActionButton.addEventListener('click', toggleChatSection);
            }
            if (backButton) {
                backButton.addEventListener('click', function () {
                    setChatOpen(false);
                });
            }
            root.querySelector('.oet-contact-widget__composer').addEventListener('submit', sendMessage);

            syncVisitorInputs();
            renderMessages();
            updateBadge();
            setOpen(false);
            setChatOpen(false);
            startAttentionAnimation();

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && isOpen) {
                    setOpen(false);
                }
            });

            document.addEventListener('pointerdown', function (event) {
                if (!isOpen) {
                    return;
                }

                if (!root.contains(event.target)) {
                    setOpen(false);
                }
            });

            window.addEventListener('focus', function () {
                if (state.threadRef) {
                    syncThread(false);
                }
            });

            document.addEventListener('visibilitychange', function () {
                if (!document.hidden && state.threadRef) {
                    syncThread(false);
                }
            });

            if (state.threadRef) {
                // one catch-up sync for the unread badge; continuous polling only runs while open
                syncThread(false);
            }
        }

        buildWidget();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOetContactWidget, { once: true });
    } else {
        initOetContactWidget();
    }
})();
