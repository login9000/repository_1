## player_teleported

> **Сообщение отправляется со стороны backend**

> Данное сообщение отправляется всем пользователям после того как один из пользователей отправил сообщение [teleport](users/coordinates/teleport.md), и не отправляется пользователю которые отправил сообщение [teleport](users/coordinates/teleport.md).

## Структура сообщения:

```json
{
  "type": "player_teleported",
  "user_id": 2,
  "x": 2500,
  "y": 1300
}
```

## Описание полей

- **user_id** — ID пользователя.
- **x** и **y** — координаты телепорта которые были присланы через исходное сообщение [teleport](users/coordinates/teleport.md)
