# Координаты пользователей


Все сообщения содержат следующую струкутуру:

```json
{
    "type": "тип сообщения",
    ... остальные данные сообщения ...
}

```

Типы сообщений передаваемые через WebSocket:

-   Сообщения с Backend
    -   [initial_players](users/coordinates/intial_players.md)
    -   [player_joined](users/coordinates/player_joined.md)
    -   [player_moved](users/coordinates/player_moved.md)
    -   [player_teleported](users/coordinates/player_teleported.md)
    -   [player_leaved](users/coordinates/player_leaved.md)
-   Сообщения с Frontend
    -   [position_update](users/coordinates/position_update.md)
    -   [teleport](users/coordinates/teleport.md)
