import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class SocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.subscriptions = new Map();
    }

    connect(token, onConnected, onError) {
        if (this.connected) return;

        const socket = new SockJS(SOCKET_URL);
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = (frame) => {
            this.connected = true;
            if (onConnected) onConnected(frame);
        };

        this.stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            if (onError) onError(frame);
        };

        this.stompClient.activate();
    }

    subscribe(destination, callback) {
        if (!this.connected) return null;

        // Prevent duplicate subscriptions
        if (this.subscriptions.has(destination)) {
            this.subscriptions.get(destination).unsubscribe();
        }

        const subscription = this.stompClient.subscribe(destination, (message) => {
            callback(JSON.parse(message.body));
        });

        this.subscriptions.set(destination, subscription);
        return subscription;
    }

    sendMessage(destination, body) {
        if (this.stompClient && this.connected) {
            this.stompClient.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        }
    }

    disconnect() {
        if (this.stompClient && this.connected) {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions.clear();
            this.stompClient.deactivate();
            this.connected = false;
        }
    }
}

export const socketService = new SocketService();
