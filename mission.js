// ==========================================
// ROUTEGUARD AI
// MISSION SELECT — NAVIGATION LOGIC
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // MISSION CARDS → OPEN COMMAND CENTER
    // ==========================================

    const missionCards = document.querySelectorAll(".mission-card");

    missionCards.forEach(card => {

        card.addEventListener("click", () => {

            window.location.href = "command.html";

        });

    });


    // ==========================================
    // QUICK ROUTE BUTTON → OPEN COMMAND CENTER
    // ==========================================

    const quickRouteBtn = document.querySelector(".quick-route button");

    if (quickRouteBtn) {

        quickRouteBtn.addEventListener("click", () => {

            window.location.href = "command.html";

        });

    }

});
