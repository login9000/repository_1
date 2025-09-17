import { defineStore } from 'pinia';
import { ref } from 'vue';
import { API_URL } from "../config.js";
import { WS_URL } from "../config.js";
import emitter from "../plugins/emitter.js";

export const useUserStore = defineStore('user', () => {
    const user = ref(null);
    const token = ref(null);
    const externalUserData = ref(null); // Add this to store external user data

    const isAuthenticated = ref(false);

    globalThis.initialPlayers = [];

    const login = async () => {
        try {
            const response = await fetch('/api/v1/check_auth_disco');
            const data = await response.json();

            if (!response.ok) {
                window.location.href = '/#' + data.error;
            } else {

                globalThis.WEB_SOCKET = new WebSocket(WS_URL + `wss`);
                WEB_SOCKET.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        switch (data.type) {
                            case "error":
                                window.location.href = '/#' + data.message;
                                break;
                        }
                    } catch (e) {
                        window.location.href = '/#BAD_REQUEST';
                    }
                };

                
                WEB_SOCKET.addEventListener("error", (event) => {
                    emitter.emit('inactive-screen', true);
                    window.location.reload();
                });
                WEB_SOCKET.addEventListener("close", (event) => {
                    emitter.emit('inactive-screen', true);
                    window.location.reload();
                });



                isAuthenticated.value = true;
                await fetchUserData();
            }
        } catch (error) {
            window.location.href = '/#BAD_REQUEST';
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/v1/get_other_variables?target=disco');

            if (!response.ok) {
                window.location.href = '/#BAD_REQUEST';
            }
            const data = await response.json();
            user.value = data.response;

            user.value.id = user.value.user_myid;
            user.value.username = user.value.login;

            if (typeof (user.value.csrf_token) == 'string') {
                let meta = document.createElement('meta');
                meta.setAttribute('name', 'csrf-token');
                meta.setAttribute('content', user.value.csrf_token);
                document.getElementsByTagName('head')[0].appendChild(meta);
            }

        } catch (error) {
            window.location.href = '/#BAD_REQUEST';
        }
    };

    // New function to fetch external user data
    const fetchExternalUserData = async (userId) => {
        // try {
        //     const response = await fetch(`${API_URL}user-info/${userId}`, {
        //         headers: {
        //             'accept': 'application/json',
        //             'Authorization': `Bearer ${token.value}`,
        //         },
        //     });

        //     if (!response.ok) {
        //         console.error('Ошибка получения внешних данных пользователя');
        //         externalUserData.value = null;
        //         return;
        //     }

        //     externalUserData.value = await response.json();
        // } catch (error) {
        //     console.error('Ошибка при запросе внешних данных пользователя:', error);
        //     externalUserData.value = null;
        // }
    };

    // Function to set myid and fetch external data
    const setMyId = async (userId, myid) => {
        const response = await fetch(`${API_URL}users/${userId}/set-myid?myid=${myid}`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token.value}`,
            },
        });

        if (!response.ok) {
            throw new Error('Ошибка установки myid');
        }

        // Update user data and fetch external data
        await fetchUserData();
    };

    const updateAvatar = async (userId, avatarUpdate) => {
        const response = await fetch(`${API_URL}users/${userId}/avatar?avatar_update=${avatarUpdate}`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token.value}`,
            },
            body: '', // Тело запроса пустое, как указано в curl-запросе
        });

        if (!response.ok) {
            throw new Error('Ошибка обновления аватара');
        }

        // После успешного обновления аватара, можно обновить данные пользователя
        await fetchUserData();
    };

    const logout = () => {
        user.value = null;
        token.value = null;
        externalUserData.value = null;
        isAuthenticated.value = false;
    };

    return {
        user,
        token,
        isAuthenticated,
        externalUserData, // Expose the external user data
        login,
        logout,
        fetchUserData,
        fetchExternalUserData, // Expose  method user data
        setMyId, // Expose the method to set myid
        updateAvatar,
    };
});