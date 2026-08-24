* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, Helvetica, sans-serif;
    background: #040a12;
    color: white;
    min-height: 100vh;
}

.mission-screen {
    min-height: 100vh;
    padding: 35px 6%;
    background:
        radial-gradient(circle at 20% 20%, rgba(0, 208, 132, 0.08), transparent 28%),
        radial-gradient(circle at 85% 75%, rgba(0, 140, 255, 0.07), transparent 30%),
        #040a12;
}


/* TOP BAR */

.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand {
    font-size: 27px;
    font-weight: 800;
    letter-spacing: -1px;
}

.brand span {
    color: #00d084;
}

.system {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    border: 1px solid rgba(0, 208, 132, 0.25);
    border-radius: 20px;
    color: #00d084;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
}

.system span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #00d084;
    box-shadow: 0 0 12px #00d084;
    animation: pulse 1.5s infinite;
}


/* INTRO */

.intro {
    max-width: 720px;
    margin: 85px auto 55px;
    text-align: center;
}

.eyebrow {
    color: #00d084;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 2.5px;
    margin-bottom: 15px;
}

.intro h1 {
    font-size: clamp(42px, 5vw, 68px);
    line-height: 1;
    letter-spacing: -3px;
}

.intro h1 span {
    color: #00d084;
}

.intro p:last-child {
    margin-top: 20px;
    color: #8193a6;
    font-size: 15px;
    line-height: 1.7;
}


/* MISSIONS */

.missions {
    max-width: 1050px;
    margin: auto;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.mission-card {
    position: relative;
    min-height: 230px;
    padding: 28px;
    display: flex;
    gap: 22px;
    text-align: left;
    color: white;
    background: #091521;
    border: 1px solid #1c3043;
    border-radius: 18px;
    cursor: pointer;
    overflow: hidden;
    transition: 0.3s ease;
}

.mission-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
        120deg,
        rgba(0, 208, 132, 0.07),
        transparent 45%
    );
    opacity: 0;
    transition: 0.3s;
}

.mission-card:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 208, 132, 0.55);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
}

.mission-card:hover::before {
    opacity: 1;
}


/* ICON */

.icon {
    position: relative;
    z-index: 2;
    min-width: 58px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    font-size: 27px;
    background: rgba(0, 208, 132, 0.07);
    border: 1px solid rgba(0, 208, 132, 0.18);
}


/* CONTENT */

.mission-content {
    position: relative;
    z-index: 2;
}

.mission-number {
    color: #00d084;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 1.5px;
}

.mission-content h2 {
    margin-top: 9px;
    font-size: 21px;
}

.mission-content p {
    max-width: 360px;
    margin-top: 10px;
    color: #788b9e;
    font-size: 12px;
    line-height: 1.65;
}

.mission-action {
    margin-top: 22px;
    color: #00d084;
    font-size: 11px;
    font-weight: bold;
}


/* QUICK ROUTE */

.quick-route {
    max-width: 1050px;
    margin: 22px auto 0;
    padding: 23px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid #1b3042;
    border-radius: 15px;
    background: #07111c;
}

.quick-route span {
    color: #607589;
    font-size: 8px;
    letter-spacing: 2px;
}

.quick-route h3 {
    margin-top: 5px;
    font-size: 15px;
}

.quick-route p {
    margin-top: 4px;
    color: #718498;
    font-size: 11px;
}

.quick-route button {
    padding: 12px 18px;
    border: 1px solid #00d084;
    border-radius: 8px;
    color: #00d084;
    background: rgba(0, 208, 132, 0.05);
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
}

.quick-route button:hover {
    color: #041019;
    background: #00d084;
}


/* FOOTER */

footer {
    margin-top: 45px;
    text-align: center;
    color: #35495b;
    font-size: 10px;
}


/* ANIMATION */

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }

    50% {
        opacity: 0.35;
    }
}


/* RESPONSIVE */

@media (max-width: 750px) {

    .mission-screen {
        padding: 25px 20px;
    }

    .intro {
        margin-top: 60px;
    }

    .missions {
        grid-template-columns: 1fr;
    }

    .quick-route {
        flex-direction: column;
        align-items: flex-start;
    }
}

@media (max-width: 480px) {

    .topbar {
        align-items: flex-start;
        gap: 15px;
    }

    .system {
        font-size: 8px;
    }

    .intro h1 {
        font-size: 42px;
    }

    .mission-card {
        padding: 22px;
    }
}