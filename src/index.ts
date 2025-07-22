import { WebSocketServer, WebSocket } from "ws";
import dotenv from 'dotenv';
dotenv.config();
const PORT = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({ port: PORT });


const roomToSocket = new Map<string, WebSocket[]>();
const idToSocket = new Map<WebSocket, string>();

const str = "ABCDEFGJIJKLMNOPQRSTUVWXYZ0123456789";

function generateRoomId() {
    let code = "";
    for (let i = 0; i < 8; i++) {
        const idx = Math.floor(Math.random() * str.length);
        code += str.charAt(idx);
    }
    return code;
}
wss.on("connection", function (ws) {
    console.log("connected")
    ws.on("message", function (message) {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === "create") {
            const roomCode = generateRoomId();
            roomToSocket.set(roomCode, []);
            ws.send(
                JSON.stringify({
                    type : "created",
                    roomId: roomCode,
                })
            );
        } else if (parsedMessage.type === "join" || parsedMessage.type === "chat") {
            const roomId = parsedMessage.payload.roomId;
            if (!roomToSocket.has(roomId)) {
                ws.send(
                    JSON.stringify({
                        "type" : "joinOrCreate",
                        "status" : "404",
                        "message": `The room with room code ${roomId} does not exist.`,
                    })
                );
                return;
            } else {
                if (parsedMessage.type === "join") {
                    roomToSocket.get(roomId)?.push(ws);
                    ws.send(
                        JSON.stringify({
                            "type" : "joined",
                            "status" : "200",
                            "roomId" : roomId,
                            "message": "joined"
                        })
                    );
                    return
                }
                else if( parsedMessage.type === "chat"){
                    const allSockets: WebSocket[] | undefined = roomToSocket.get(roomId);
                    const sockets = allSockets?.filter((s) => s != ws);
                    if(sockets === allSockets){
                        ws.send(
                            JSON.stringify({
                                "type" : "chat",
                                "status" : "403",
                                'message' : 'You can not send message to this room'
                            })
                        );
                        return;
                    }
                    else{
                        sockets?.forEach(s => {
                            s.send(
                                JSON.stringify({
                                    "type" : "chat",
                                    "status" : "200",
                                    "message": parsedMessage.payload.text,
                                })
                            );
                        })
                    }
                }
            }
       
        }
    });
});
