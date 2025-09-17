
import Bubbles from '../game/helpers/bubbles';

class bubbleMessages {

    constructor(message_per_bubble = 3) {
        this.rules = [
            {
                'type': 'text',
                'length': 16,
                'compare': 'below',
                'time': 3 * 1000
            },
            {
                'type': 'text',
                'length': 74,
                'compare': 'below',
                'time': 7.3 * 1000
            },
            {
                'type': 'text',
                'length': 174,
                'compare': 'below',
                'time': 13 * 1000
            },
            {
                'type': 'text',
                'length': 300,
                'compare': 'below',
                'time': 15 * 1000
            },
            {
                'type': 'text',
                'length': 300,
                'compare': 'above',
                'time': 18 * 1000
            },
            {
                'type': 'image',
                'time': 18 * 1000
            },
            {
                'type': 'image_and_text',
                'time': 18 * 1000
            }
        ];
        this.messages = [];
        this.content = [];
        this.content_archive = {};
        this.message_per_bubble = message_per_bubble;
        this.messages_for_player_id = null;
    }


    flush() {
        this.messages = [];
        this.content = [];
    }

    addText(text, uuid, sender_id = false, receiver_id = false, thought = false, image = '') {

        this.messages.push({
            'text': text,
            'uuid': uuid,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'status': (thought) ? 'read' : 'unread',
            'shown': false,
            'length': text.length,
            'image': image,
            'type': (image !== '') ? 'image' : 'text'
        });
    }

    checkMessageTime() {
        let current_time = Date.now();
        for (let message_id in this.content) {
            let message = this.content[message_id];
            if (message.sender_id == false) {
                if (message.end_time <= current_time) {
                    this.content[message_id].shown = true;
                }
                if (message.end_time <= current_time && message.status == 'read') {
                    delete this.content[message_id];
                    delete this.messages[message.message_id];
                }
            } else {
                if (message.end_time <= current_time) {
                    delete this.content[message_id];
                    delete this.messages[message.message_id];
                }
            }
        }
        this.messages = this.messages.filter(item => item);
        this.content = this.content.filter(item => item);
    }


    applyRules() {

        this.checkMessageTime();

        if (this.content.length == this.message_per_bubble)
            return true;

        let current_time = Date.now();
        if (this.messages.length > 0) {
            for (let message_id in this.messages) {
                var message = this.messages[message_id];

                if (this.messages_for_player_id !== null) {
                    if (this.messages_for_player_id !== message.receiver_id)
                        continue;
                }

                if (this.content.length < this.message_per_bubble) {
                    for (let rule of this.rules) {
                        if (message.processed)
                            continue;

                        if (message.type == 'image' && rule.type == 'image') {
                            message.end_time = current_time + rule.time;
                            message.duration = rule.time;
                            message.message_id = message_id;
                            this.content.push(message);
                            message.processed = true;
                        }

                        if (message.type == 'image_and_text' && rule.type == 'image_and_text') {
                            message.end_time = current_time + rule.time;
                            message.duration = rule.time;
                            message.message_id = message_id;
                            this.content.push(message);
                            message.processed = true;
                        }

                        if (message.type == 'text' && rule.type == 'text') {
                            switch (rule.compare) {
                                case 'below':
                                    if (message.length <= rule.length) {
                                        message.end_time = current_time + rule.time;
                                        message.duration = rule.time;
                                        message.message_id = message_id;
                                        this.content.push(message);
                                        message.processed = true;
                                    }
                                    break;
                                case 'above':
                                    if (message.length >= rule.length) {
                                        message.end_time = current_time + rule.time;
                                        message.duration = rule.time;
                                        message.message_id = message_id;
                                        this.content.push(message);
                                        message.processed = true;
                                    }
                                    break;
                            }
                        }


                        if (message.sender_id !== false) {
                            const userData = window.gameInstance.registry.get('userData');
                            globalThis.WEB_SOCKET.send(JSON.stringify({ "type": "private_message_is_read", "receiver_id": message.sender_id, "sender_id": userData.userId, "uuid": message.uuid, "status": "read" }));
                        }

                    }
                }
            }
        }
    }

    getRemainingTime() {

        if (typeof (this.content[0]) == 'object') {
            return {
                time: this.content[0].end_time,
                duration: this.content[0].duration,
                count: this.content.length,
                status: this.content[0].status
            }
        }
        return { count: 0 };
    }

    makeMessageRead(uuid, receiver_id) {

        for (let message_id in this.messages) {
            let message = this.messages[message_id];
            if (message.receiver_id == receiver_id && message.uuid == uuid) {
                this.messages[message_id].status = 'read';
            }
        }


        let current_time = Date.now();
        for (let message_id in this.content) {
            let message = this.content[message_id];
            if (message.receiver_id == receiver_id && message.uuid == uuid) {
                this.content[message_id].end_time = current_time + message.duration;
            }
        }
        for (let player_id in this.content_archive) {
            let player_messages = this.content_archive[player_id];
            for (let message_id in player_messages) {
                let message = player_messages[message_id];
                if (message.receiver_id == receiver_id && message.uuid == uuid) {
                    this.content_archive[player_id][message_id].end_time = current_time + message.duration;
                }
            }
        }

    }

    getMessagesCount() {
        return this.messages.length;
    }

    getFormatedString() {
        this.applyRules();
        var _obj = this;
        return this.content.map((message) => {

            if (_obj.messages_for_player_id !== null) {
                if (_obj.messages_for_player_id == message.receiver_id)
                    return message.text;
            } else {
                return message.text;
            }

        }).join('');
    }
    getCurrentContent() {
        this.applyRules();
        return this.content;
    }
    getFormatedContent() {
        this.applyRules();
        let content = [];

        for (let item_id in this.content) {
            if (!this.content[item_id].shown) {
                content[item_id] = JSON.parse(JSON.stringify(this.content[item_id]));
                content[item_id].text = Bubbles.breakLongWords(content[item_id].text) + ((content[item_id].image.content == '') ? '\n\n' : "");
            }
        }

        if (content.length > 0)
            content[content.length - 1].text = content[content.length - 1].text.trim();

        return content;

        let output = '';

        for (let num in this.content) {
            if (!this.content[num].shown) {
                output += Bubbles.breakLongWords(this.content[num].text) + '\n\n';
            }
        }

        return output.trim();
    }
    getMessagesLength() {
        return this.getFormatedString().length;
    }

    setCurrentChattingPlayerId(id) {
        if (this.messages_for_player_id !== id) {
            this.content_archive[this.messages_for_player_id] = this.content;

            if (typeof (this.content_archive[id]) !== 'undefined') {
                this.content = this.content_archive[id];
            } else {
                this.content = [];
            }
        }

        this.messages_for_player_id = id;
    }
}

export default bubbleMessages