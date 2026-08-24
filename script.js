const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const nameField = document.getElementById("nameField");
const authForm = document.getElementById("authForm");
const mainBtn = document.querySelector(".main-btn");

loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    nameField.classList.add("hidden");
    mainBtn.textContent = "Login";
});

registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    nameField.classList.remove("hidden");
    mainBtn.textContent = "Create Account";
});

authForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (registerTab.classList.contains("active")) {
        alert("Registration successful!");
    } else {
        alert("Login successful!");
    }
});