// ==========================================
// ROUTEGUARD AI - LOGIN / REGISTER
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const nameField = document.getElementById("nameField");
const roleSection = document.getElementById("roleSection");

const authForm = document.getElementById("authForm");

const mainBtn = document.querySelector(".enter-btn");


// ==========================================
// LOGIN TAB
// ==========================================

loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    nameField.classList.add("hidden");
    roleSection.classList.add("hidden");

    mainBtn.innerHTML = `
        <span>ENTER COMMAND CENTER</span>
        →
    `;

});


// ==========================================
// REGISTER TAB
// ==========================================

registerTab.addEventListener("click", () => {

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    nameField.classList.remove("hidden");
    roleSection.classList.remove("hidden");

    mainBtn.innerHTML = `
        <span>CREATE ACCOUNT</span>
        →
    `;

});


// ==========================================
// FORM SUBMIT
// ==========================================

authForm.addEventListener("submit", (event) => {

    event.preventDefault();


    // --------------------------------------
    // REGISTER
    // --------------------------------------

    if (registerTab.classList.contains("active")) {

        alert("Registration successful!");


        // After registration,
        // switch back to Login

        registerTab.classList.remove("active");
        loginTab.classList.add("active");

        nameField.classList.add("hidden");
        roleSection.classList.add("hidden");

        mainBtn.innerHTML = `
            <span>ENTER COMMAND CENTER</span>
            →
        `;

        return;
    }


    // --------------------------------------
    // LOGIN
    // --------------------------------------

    alert("Login successful!");


    // Open Dashboard

    window.location.href = "dashboard.html";

});
