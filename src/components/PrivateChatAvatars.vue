<template>
    <div class="private-chat-avatars" :key="this.counter">
        <span class="private-chat-avatar__name" ref="name-label"></span>
        <div class="private-chat-avatars-cont">
            <div v-for='player in avatars'
                :class="'private-chat-avatar' + ((getActiveUser() == player.user_id) ? ' active' : '')"
                :data-name="player.username" :key="Math.random()"
                @click.stop="() => (changeChattingUser(player.user_id))" @mouseenter="showNameLabel"
                @mouseleave="hideNameLabel">
                <span v-if="player.count" class="private-chat-avatar__count_message">{{ player.count }}</span>
                <img v-if="player.avatar !== ''" :src="'/user_files/' + player.user_id + '/avatar/' + player.avatar" />
                <img v-else :src="'/img/no_avatar.png'" />
            </div>
        </div>
    </div>
</template>

<script>

import emitter from '../plugins/emitter.js';
import { useTemplateRef, onMounted } from 'vue';

export default {
    props: {
        otherUserId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            counter: 0,
            avatars: {},
        }

    },
    mounted() {
        emitter.on("player-private-chatting", this.activatingChat);
        emitter.on('avatars-changed', this.avatarsChanged);
    },
    methods: {
        hideNameLabel(event) {
            this.$refs['name-label'].style.display = 'none';
        },
        activatingChat(player_id) {
            this.counter = player_id;
        },
        showNameLabel(event) {


            if (event.target.nodeName == 'DIV') {
                this.$refs['name-label'].style.display = 'inline';
                this.$refs['name-label'].innerHTML = event.target.getAttribute('data-name');
                this.$refs['name-label'].style.left = event.target.offsetLeft - 30 + 'px';
            }
        },
        avatarsChanged(avatars) {
            this.avatars = avatars;
            this.counter = JSON.stringify(avatars);
        },
        changeChattingUser(player_id) {

            if (typeof (window.gameInstance) == 'object' && typeof (gameInstance.currentChattingUserId) !== 'undefined' && gameInstance.currentChattingUserId !== player_id) {

                if (typeof (window.gameInstance.bubbleMessages.others[window.gameInstance.currentChattingUserId]) !== 'undefined' && typeof (window.gameInstance.bubbles.others[gameInstance.currentChattingUserId])) {
                    window.gameInstance.bubbleMessages.others[window.gameInstance.currentChattingUserId].messages.flush();
                    if (typeof (window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubble) == 'object' && typeof (window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubble.destroy) == 'function')
                        window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubble.destroy();
                    if (typeof (window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubbleText) == 'object' && typeof (window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubbleText.destroy) == 'function')
                        window.gameInstance.bubbles.others[gameInstance.currentChattingUserId].bubbleText.destroy();
                }
            }

            window.gameInstance.currentChattingUserId = player_id;
            emitter.emit("player-private-chatting", player_id);
            emitter.emit("ensure-private-chat-visible", player_id);

            this.counter = player_id;
        },
        getActiveUser() {
            return window.gameInstance.currentChattingUserId;
        },
    }
}
</script>
<style scoped>
.private-chat-avatars {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    z-index: 20;
    margin-bottom: 20px;
    z-index: 9999;

    .private-chat-avatars-cont {
        overflow-y: visible !important;
        overflow-x: auto;
        position: relative;
        width: 100%;
        display: flex;
        align-items: flex-end;
        flex-wrap: nowrap;
        scrollbar-width: thin;
        padding-top: 5px;
        padding-left: 10px;
    }

    span.private-chat-avatar__name {
        display: none;
        background: rgba(255, 255, 255, 0.8);
        color: black;
        padding: 10px 20px;
        white-space: nowrap;
        text-align: center;
        border-radius: 8px;
        width: auto;
        position: absolute;
        top: -25px;
        transform: translateY(-50%);
        z-index: 9999;

        &:after {
            content: ' ';
            display: block;
            left: 50%;
            transform: translateX(-50%);
            bottom: -6px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid rgba(255, 255, 255, 0.8);
            position: absolute;

        }
    }

    .private-chat-avatar {
        position: relative;
        width: 80px;
        min-width: 80px;
        cursor: pointer;
        margin-right: 10px;
        height: 80px;

        &:not(.active) {
            &:before {
                content: ' ';
                display: block;
                width: 100%;
                height: 100%;
                top: 0px;
                left: 0px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10;
                position: absolute;
            }

            &:hover {
                &:before {
                    background: rgba(0, 0, 0, 0.35);

                }
            }

            img {
                border-color: #7A7A7A;
                box-shadow: 0px 0px 8px 0px #7A7A7A;
                filter: grayscale(50%);
            }
        }

        span.private-chat-avatar__count_message {
            position: absolute;
            background: #5AE050;
            right: 0px;
            color: white;
            width: 30px;
            height: 30px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-weight: bold;
            z-index: 15;
        }


        img {
            height: 100%;
            border: solid 1px #377CE2;
            box-shadow: 0px 0px 8px 0px #377CE2;
            max-height: 100px;
            border-radius: 50%;
            z-index: 0;

        }
    }
}
</style>