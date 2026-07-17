(function($){
    "use strict";

    const scene = document.getElementById("scene");
const tags = document.querySelectorAll(".tag");

if (scene && tags.length > 0) {

    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    scene.addEventListener("mousemove", e => {
        const rect = scene.getBoundingClientRect();
        mouseX = e.clientX - rect.left - rect.width / 2;
        mouseY = e.clientY - rect.top - rect.height / 2;
    });

    scene.addEventListener("mouseleave", () => {
        mouseX = mouseY = 0;
    });

    function animate() {
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        tags.forEach(tag => {
            const depth = tag.dataset.depth;
            const x = currentX * depth;
            const y = currentY * depth;

            tag.style.transform = `translate(${x}px, ${y}px)`;
        });

        requestAnimationFrame(animate);
    }

    animate();

    tags.forEach(tag => {
        tag.addEventListener("mousemove", e => {
            const rect = tag.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            tag.style.transform += ` translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        tag.addEventListener("mouseleave", () => {
            tag.style.transform = "";
        });
    });

}





})(jQuery);