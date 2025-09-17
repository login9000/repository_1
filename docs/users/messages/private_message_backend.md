## private_message

> **Сообщения отправляются со стороны backend**

> Сообщения отправляется только пользователю который было указано в поле **receiver_id** из запроса [private_message](users/messages/private_message_frontend.md)

## Структура сообщениий:

### 1. Сообщение которое приходит адресату от отправителя:

```json
{
  "type": "private_message",
  "message": {
    "id": 351,
    "content": "dasdas",
    "uuid": "e7ec297e-e488-4275-8276-71e1583f2bbc",
    "sender_id": 2,
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg....",
    "receiver_id": 3,
    "timestamp": "2025-06-05T18:22:59.320755",
    "is_bubble": true,
    "is_private": true,
    "from_bubble_chat": true
  }
}
```

#### Описание полей
- **message** — структура сообщения:
    - **id** - ID сообщения
    - **uuid** — UUID v4 генерируемый функцией — https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID.
    - **receiver_id** — ID пользователя получателя сообщения
    - **sender_id** — ID пользователя отправителя сообщения
    - **image** — Изображение в формате base64 как в формте png, так и в формате jpg. Данное поле необходимо проверить на стороне backend что в коде действительно содержится картинка, перед отправкой пользователю получателю.
    - **content** — Тест сообщения
    - **from_bubble_chat** — признак того, что сообщение было отправлено из всплывающего окошка/облачка (значение должно быть таким же как в сообщение с frontend [private_message](users/messages/private_message_frontend.md))
    - **is_private** - признак того, это приватное сообщение (значение должно быть таким же как в сообщение с frontend [private_message](users/messages/private_message_frontend.md))
    - **is_bubble** — признак того, что данное сообщение в высплающем окне (значение должно быть таким же как в сообщение с frontend [private_message](users/messages/private_message_frontend.md))
    - **show_bubble** — признак того, что данное сообщение необходимо отобразить в высплающем окне (значение должно быть таким же как в сообщение с frontend [private_message](users/messages/private_message_frontend.md))

### 2. Сообщение которое приходит отправителю от адресата в случае прочтения адресатом сообщения:




```json
{
    "type": "private_message",
    "message": {
        "receiver_id": "364580703692",
        "sender_id": "483467661983",
        "uuid": "e7ec297e-e488-4275-8276-71e1583f2bbc",
        "status": "read"
    }
}
```

#### Описание полей

- **message** — структура сообщения:
    - **receiver_id** — ID пользователя получателя сообщения
    - **sender_id** — ID пользователя отправителя сообщения
    - **uuid** — UUID v4 генерируемый функцией — https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID.
    - **status** — Статус сообщения, может быть только read.

