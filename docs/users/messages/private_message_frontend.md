## private_message

> **Сообщения отправляются со стороны frontend**

## Структура сообщениий:

### 1. Сообщение которое отправляется адресату от отправителя:

```json
{
  "type": "private_message",
  "receiver_id": 1,
  "uuid": "e7ec297e-e488-4275-8276-71e1583f2bbc",
  "content": "Тест",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg....",
  "from_bubble_chat": true,
  "is_private": true,
  "from_bubble_chat": true,
  "is_bubble": true,
  "show_bubble": true
}
```

#### Описание полей

- **receiver_id** — ID пользователя получателя сообщения
— **uuid** — UUID v4 генерируемый функцией — https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID.
- **content** — Тест сообщения
- **image** — Изображение в формате base64 как в формте png, так и в формате jpg.
- **from_bubble_chat** — признак того, что сообщение было отправлено из всплывающего окошка/облачка
- **is_private** - признак того, это приватное сообщение
- **is_bubble** — признак того, что данное сообщение в высплающем окне
- **show_bubble** — признак того, что данное сообщение необходимо отобразить в высплающем окне

### 2. Сообщение которое отправляется отправителю от адресата в случае прочтения адресатом сообщения:


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

