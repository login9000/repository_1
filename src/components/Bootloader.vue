<script setup>
import { ref, onMounted, watch } from 'vue';
import emitter from "../plugins/emitter.js";


onMounted(() => {

    console.clear();

    String.prototype.replaceAt = function (index, replacement) {
        return this.substring(0, index) + replacement + this.substring(index + replacement.length);
    }

    const historyEl = document.querySelector('.disco__bootloader ul#terminal-history');
    const terminalText = document.querySelector('.disco__bootloader #terminal-text');
    const delay = 200
    let currentText = "";

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';

    const characters = `${latin}${nums}`;

    var messages = [];

    init();

    function init() {
        delayMsg('*** Welcome to the escape disco ***', delay / 2);
        // setTimeout(displayMsgs, delay);
    }

    emitter.on("bootloader-loading", (loaded, message) => {
        if (!messages.includes(message)) {
            messages.push(message);
            delayMsg(message);
        }
    });

    function delayMsg(msg, ms) {
        setTimeout(() => {
            historyEl.insertAdjacentHTML("beforeend", `<li>${msg}</li>`);
        }, ms)
    }

    function updateTerminalText() {
        terminalText.textContent = currentText;
    }

    function inputTerminalText() {
        if (currentText.toLowerCase() === "glitch") {
            glitchOut();
        } else {
            historyEl.insertAdjacentHTML("beforeend", `<li>${currentText}</li>`);
        }
    }

    function glitchOut() {
        document.querySelector('.disco__bootloader #caret').classList.remove('blinking');
        document.querySelectorAll('.disco__bootloader ul#terminal-history > li').forEach((li, i) => {
            const text = li.textContent;
            const textLength = text.length;
            setTimeout(() => {
                let iLetter = 0;
                const interval = setInterval(() => {
                    const randomChar = Math.floor(Math.random() * characters.length);
                    let characterSet = Math.random() < 0.9 ? characters : katakana;
                    let newChar = Math.random() > 0.3 ? characterSet[randomChar] : ' ';
                    newChar = Math.random() < 0.9 ? newChar : newChar + characterSet[Math.floor(Math.random() * characterSet.length)];
                    let newStr = li.textContent.replace(text[iLetter], newChar);
                    li.textContent = newStr;
                    iLetter++
                    if (iLetter >= text.length) {
                        if (i === 0) {
                            displayAlert();
                        }
                        clearInterval(interval);
                    }
                }, 100);
            }, 1000)
        })
    }

    function displayAlert() {
        document.querySelector('.disco__bootloader #alert').classList.remove('hidden');
    }

    window.addEventListener('keyup', e => {
        const key = e.key;
        if (key.toLowerCase() === "enter") {
            inputTerminalText();
            currentText.toLowerCase() === 'glitch' ? currentText : '';
        } else if (key.toLowerCase() === "backspace") {
            currentText = currentText.length ? currentText.slice(0, -1) : currentText;
        } else if (`${latin + " "}`.toLowerCase().includes(key.toLowerCase())) {
            if (currentText.toLowerCase() === "glitch") {
                return false;
            } else {
                currentText += key;
            }
        }
        updateTerminalText();
    })
});

</script>
<template>

    <div class="disco__bootloader">

        <ul id="terminal-history"></ul>

        <div id="terminal-input">
            <span id="terminal-text"></span><span id="caret" class="blinking"></span>
        </div>

        <div id="alert" class="hidden">ABORT...</div>
    </div>

</template>

<style scoped>
:root {
    --green: #66ff66;
}

.disco__bootloader * {
    box-sizing: border-box;
}


.disco__bootloader {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0px;
    top: 0px;
    z-index: 99999;
    background: black;

    background-color: #000;
    background: radial-gradient(#177317, #000);
    box-shadow: inset 0 0 30rem #000000;
    color: #66ff66;
    padding: 1rem;
    margin: 0;
    font-size: 1.5rem;
    text-shadow: 0 0 5px rgb(from #66ff66 calc(r + 40) calc(g + 40) b);
    font-family: "VT323", monospace;
    font-weight: 400;
    font-style: normal;
    height: 100vh;
    overflow: hidden;

}




#terminal-history {
    margin: 0;
    padding: 0;
    list-style: none;
}

#caret {
    position: relative;
    display: inline-block;
    /*   border: 1px solid #fff; */
    background-color: var(--green);
    width: 8px;
    height: 1.5rem;
}

#caret.blinking {
    animation: blink 1s steps(5, start) infinite;
    -webkit-animation: blink 1s steps(5, start) infinite;
}

@keyframes blink {
    to {
        visibility: hidden;
    }
}

@-webkit-keyframes blink {
    to {
        visibility: hidden;
    }
}

#alert {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    font-size: 6em;
    pointer-events: none;
    animation: blink 1s steps(5, start) infinite;
    -webkit-animation: blink 1s steps(5, start) infinite;
}

#alert.hidden {
    display: none;
}
</style>