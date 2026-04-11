# Skoipt Chat Frontend

Frontend для мессенджера на `React 19`, `TypeScript`, `Vite`, `MUI`, `Zustand` и `TanStack Query`.

## Стек

- `React` + `TypeScript`
- `Vite`
- `MUI`
- `TanStack Query`
- `Zustand`
- `React Router`

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` на основе примера:

```bash
cp .env.example .env
```

3. При необходимости поменять адреса API и WebSocket в `.env`.

4. Запустить dev-сервер:

```bash
npm run dev
```

## Переменные окружения

- `VITE_API_URL` — базовый HTTP URL backend API, например `http://localhost:8000`
- `VITE_WS_URL` — базовый WebSocket URL, например `ws://localhost:8000`

Если переменные не заданы, используются текущие встроенные адреса проекта.

## Скрипты

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Структура

- `src/components` — UI и составные компоненты
- `src/pages` — страницы роутера
- `src/services` — API и WebSocket-клиент
- `src/queries` — запросы и кэш серверных данных
- `src/stores` — локальные Zustand-store
- `src/lib` — инфраструктурные утилиты

## Что уже есть

- авторизация и работа с токенами
- список чатов и активный чат
- realtime через WebSocket
- загрузка файлов
- мини-приложения
- темы оформления
