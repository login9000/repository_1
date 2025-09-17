<script setup>
import emitter from "../plugins/emitter";
import { useUserStore } from '../stores/user';
import { spriteMap } from '../game/scenes/bootloader';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import { getCurrentInstance } from 'vue'
const instance = getCurrentInstance();


import 'swiper/css';
import 'swiper/css/navigation';

const userStore = useUserStore();

var userSkin = false;

const avatarItems = {
    "man_1": "Парень 1",
    "man_2": "Парень 2",
    "man_3": "Парень 3",
    "man_4": "Парень 4",
    "woman1": "Девушка 1",
    "woman2": "Девушка 2",
    "woman3": "Девушка 3",
    "woman4": "Девушка 4",
    "womang1": "Girl 1",
    "womang2": "Girl 2",
    "womang3": "Girl 3",
    "womang4": "Girl 4",
    "womang5": "Girl 5",
    "ninja": "Ninja",
    "gs1": "Girl Super",
    "a1": "A1 Super",
    "elvis": "Elvis",
    "macho": "Macho",
    "snowwhite": "Snow White",
    "strannik": "Strannik",
    // "BlondeMan": "BlondeMan",
    "lolita": "Lolita",
};


await userStore.fetchUserData();

function checkListItem(key) {
    if (typeof (avatarItems[key]) !== 'undefined')
        return true;
    return false;
}

function getCharacterImg(key) {
    return 'assets/avatars/' + key + '/skin.png';
}

function selectUserSkin(key) {
    userSkin = key;
    globalThis.WEB_SOCKET.send(JSON.stringify({
        "type": "changing_skin",
        "skin": userSkin
    }));
    instance?.proxy?.$forceUpdate();
}

function goToGame() {
    if (userSkin) {
        emitter.emit('show-skin-selector', false);
        emitter.emit('player-skin-selected', userSkin);
    }
}

</script>
<template>

    <div class="disco_char_store">
        <div class="disco_char_store__top_line">

            <div class="disco_char_store__top_line_name">
                {{ userStore.user.login }}
            </div>

            <div class="disco_char_store__top_line_search">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M13 20.6923C17.2483 20.6923 20.6923 17.2483 20.6923 13C20.6923 8.75166 17.2483 5.30769 13 5.30769C8.75166 5.30769 5.30769 8.75166 5.30769 13C5.30769 17.2483 8.75166 20.6923 13 20.6923ZM13 23C18.5229 23 23 18.5229 23 13C23 7.47715 18.5229 3 13 3C7.47715 3 3 7.47715 3 13C3 18.5229 7.47715 23 13 23Z"
                        fill="#B7B4BF" />
                    <path
                        d="M21 22.4474L22.4473 21L26.7997 25.3522C27.0668 25.6192 27.0668 26.0523 26.7997 26.3194L26.3195 26.7996C26.0525 27.0668 25.6193 27.0668 25.3523 26.7998L21 22.4474Z"
                        fill="#B7B4BF" />
                </svg>
                <input type="text" placeholder="Поиск" />
            </div>


            <div class="disco_char_store__top_line_balance_cont">
                <div class="disco_char_store__top_line_balance">
                    Баланс: 0
                </div>

                <div class="disco_char_store__top_line_topup_btn">
                    <svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M17.8889 13.2778H12.7778V18.3889H10.2222V13.2778H5.11111V10.7222H10.2222V5.61111H12.7778V10.7222H17.8889V13.2778ZM20.4444 0.5H2.55556C1.13722 0.5 0 1.63722 0 3.05556V20.9444C0 21.6222 0.269245 22.2722 0.748505 22.7515C1.22776 23.2308 1.87778 23.5 2.55556 23.5H20.4444C21.1222 23.5 21.7722 23.2308 22.2515 22.7515C22.7308 22.2722 23 21.6222 23 20.9444V3.05556C23 2.37778 22.7308 1.72776 22.2515 1.2485C21.7722 0.769245 21.1222 0.5 20.4444 0.5Z"
                            fill="#F1F0F5" />
                    </svg>

                    Пополнить
                </div>
            </div>

        </div>

        <div class="disco_char_store__content">

            <div class="disco_char_store__content_cols">

                <div class="disco_char_store__content_char">
                    <template v-if="!userSkin">
                        Выберите персонажа
                    </template>
                    <template v-else>
                        <img :src="getCharacterImg(userSkin)" />
                        <button v-on:click="goToGame()">Играть</button>
                    </template>
                </div>


                <div class="disco_char_store__content_paid_list">
                    <div class="disco_char_store__content_paid_list_title">
                        Платный функционал
                    </div>
                    <div class="disco_char_store__content_paid_list_items">
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Активировать музыку в качестве hires</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Приобрести премиум аккаунт для возможности проводить стрим конференцию</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Анимированный эффект к скину</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Рамка для аватара</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Приобрести премиум аккаунт для возможности проводить стрим конференцию</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>
                        <div class="disco_char_store__content_paid_list_item">
                            <div class="disco_char_store__content_paid_list_item_title">
                                <span>Активировать музыку в качестве hires</span>
                                <img src="/assets/paid_example_box.jpg" />
                            </div>
                            <div class="disco_char_store__content_paid_list_item_price_cart">
                                <span> Цена: 305</span>
                                <button>Добавить в корзину</button>
                            </div>
                        </div>


                    </div>
                    <div class="disco_char_store__content_paid_actions">
                        <div>Общая стоимость: 0.00 &#8381;</div>
                        <button class="inactive">Оплатить</button>
                    </div>
                </div>
            </div>

            <div class="disco_char_store__content_characters">
                <div class="disco_char_store__content_characters_title">
                    Другие персонажи
                </div>
                <div class="disco_char_store__content_characters_list">

                    <swiper :style="{ '--swiper-navigation-color': '#8678D7', '--swiper-pagination-color': '#8678D7' }"
                        :modules="[Navigation]" :slides-per-view="6" :loop="true" :navigation="{
                            clicable: true,
                            // nextEl: '.swiper-button-next',
                            // prevEl: '.swiper-button-prev',
                        }" :space-between="25">

                        <template v-for="item in spriteMap">
                            <template v-if="checkListItem(item.key)">
                                <swiper-slide>
                                    <div class="disco_char_store__content_characters_list_item"
                                        v-on:click="selectUserSkin(item.key)">
                                        <div class="disco_char_store__content_characters_list_item_img">
                                            <img :src="getCharacterImg(item.key)" />
                                        </div>
                                        <div class="disco_char_store__content_characters_list_item_info">
                                            <div class="disco_char_store__content_characters_list_item_title">
                                                {{ avatarItems[item.key] }}
                                            </div>
                                            <div class="disco_char_store__content_characters_list_item_price">
                                                <svg width="18" height="23" viewBox="0 0 18 23" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                                        d="M9 0C5.68629 0 3 2.74599 3 6.13333V8.43333H0.75C0.335786 8.43333 0 8.77659 0 9.2V22.2333C0 22.6567 0.335786 23 0.75 23H17.25C17.6642 23 18 22.6567 18 22.2333V9.2C18 8.77659 17.6642 8.43333 17.25 8.43333H15V6.13333C15 2.74599 12.3137 0 9 0ZM12.75 6.13333V8.43333H5.25V6.13333C5.25 4.01624 6.92893 2.3 9 2.3C11.0711 2.3 12.75 4.01624 12.75 6.13333ZM10.8754 14.1833C10.8754 14.7737 10.6142 15.3017 10.2036 15.6533L11.1048 19.338C11.1787 19.6405 10.955 19.9333 10.65 19.9333H7.35073C7.04578 19.9333 6.82202 19.6405 6.89597 19.338L7.79711 15.6533C7.38649 15.3017 7.12536 14.7737 7.12536 14.1833C7.12536 13.1248 7.96483 12.2667 9.00036 12.2667C10.0359 12.2667 10.8754 13.1248 10.8754 14.1833Z"
                                                        fill="#B7B4BF" />
                                                </svg>
                                                500 &#8381;
                                            </div>
                                        </div>

                                    </div>

                                </swiper-slide>
                            </template>
                        </template>
                    </swiper>

                </div>
            </div>

        </div>

    </div>


</template>
<style scoped>
.disco_char_store {
    width: 100%;
    height: 100%;
    background: white;

}

div.swiper-button-prev,
div.swiper-button-next {
    color: #8678D7;
}

.disco_char_store__content_paid_actions {
    display: flex;
    justify-content: space-between;
    margin-right: 20px;

    div {
        background: #222127;
        color: #B7B4BF;
        padding: 15px 25px;
        border-radius: 9px;
        margin-right: 20px;
        font-size: 15px;
        width: 100%;
    }

    button {
        background: #8678D7;
        padding: 10px 15px;
        border-radius: 9px;
        text-transform: uppercase;
        width: 100%;

        &.inactive {
            background: #757090;
        }

        &:hover {
            background: #695da9;
        }
    }
}

.disco_char_store__content_characters_title {
    color: #A19CE0;
    font-size: 24px;
}

.disco_char_store__content_characters {
    margin-left: 100px;
    width: 100%;
    overflow: hidden;
    max-width: calc(100% - 100px);
}

.disco_char_store__content {
    background: #1A1A1F;
    max-width: 95%;
    margin: 0 auto;
    margin-top: 50px;
    border-radius: 12px;
}

.disco_char_store__content_paid_list_items {
    margin-top: 40px;
    margin-right: 20px;
}

.disco_char_store__content_paid_list_item {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: solid 1px #313035;

    &:last-child {
        border: 0px;
    }
}

.disco_char_store__content_characters_list {
    margin-top: 20px;
    margin-bottom: 30px;
}

.disco_char_store__content_characters_list_item {
    background: #2C2B31;
    border-radius: 12px;
    padding: 18px;
    cursor: pointer;
    min-height: 240px;

    &:hover {
        background: #494175;
    }

}

.disco_char_store__content_characters_list_item_info {
    margin-top: 10px;
}

.disco_char_store__content_characters_list_item_price {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    color: #B7B4BF;
    margin-top: 15px;

    svg {
        margin-right: 10px;
    }
}

.disco_char_store__content_characters_list_item_title {
    color: #B7B4BF;
    text-transform: uppercase;
}

.disco_char_store__content_characters_list_item_img {
    background: white;
    text-align: center;
    padding-top: 20px;
    padding-bottom: 20px;
    box-shadow: inset 0 0em 16px 8px #8678D7;

    img {
        height: 120px;
        display: inline;
    }
}


.disco_char_store__content_paid_list_item_title {
    color: #B7B4BF;
    text-decoration: underline;
    text-transform: uppercase;
    margin-bottom: 20px;
    position: relative;
    display: flex;
    justify-content: space-between;
    span {
        max-width: 70%;
    }

    img {
        position: relative;
        right: 0px;
        top: 0px;
        width: 60px;
        height: 60px;
        border-radius: 12px;
        overflow: hidden;
    }
}

.disco_char_store__content_paid_list_item_price_cart {
    display: flex;
    justify-content: space-between;

    span {
        color: #8678D7;
        text-transform: uppercase;
    }

    button {
        background: #8678D7;
        padding: 5px 15px;
        border-radius: 9px;
        text-transform: uppercase;

        &:hover {
            background: #695da9;
        }
    }
}

.disco_char_store__content_cols {
    display: grid;
    grid-template-columns: 60% 40%;
}

.disco_char_store__content_char {
    color: white;
    text-align: center;
    margin-left: 100px;
    min-height: 700px;
    max-width: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid 1px white;
    margin-top: 70px;
    margin-bottom: 70px;
    border-radius: 9px;
    flex-direction: column;

    button {
        background: #8678D7;
        padding: 15px 35px;
        border-radius: 9px;
        text-transform: uppercase;

        &:hover {
            background: #695da9;
        }
    }

    img {
        min-height: 400px;
    }
}

.disco_char_store__content_paid_list {
    margin-top: 30px;
    margin-left: 50px;
}

.disco_char_store__content_paid_list_title {
    color: #A19CE0;
    font-size: 22px;
}

.disco_char_store__top_line_balance_cont {
    display: flex;
    justify-content: space-between;
}

.disco_char_store__top_line_balance {
    background: #222127;
    color: #B7B4BF;
    padding: 10px 25px;
    border-radius: 9px;
    margin-right: 20px;
    font-size: 15px;
}

.disco_char_store__top_line_search {
    background: #222127;
    width: 100%;
    max-width: 700px;
    display: flex;
    border-radius: 6px;
    padding: 10px;

    input {
        width: 100%;
        padding: 5px;
        outline: none;
        color: white;

    }

    svg {
        display: block;
        position: relative;
        margin-left: 5px;
        margin-right: 5px;
        margin-top: 2px;
    }

}

.disco_char_store__top_line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: #1A1A1F;
    padding: 25px 60px;

}

.disco_char_store__top_line_name {
    color: white;
    margin-right: 20px;
    font-size: 21px;
}

.disco_char_store__top_line_topup_btn {
    background: #BF1BF8;
    cursor: pointer;
    padding: 10px 16px;
    border-radius: 9px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
        height: 18px;
        margin-right: 5px;
    }

    &:hover {
        background: #7b119f;
    }
}
</style>