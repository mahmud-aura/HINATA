const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "imagine",             
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        vi: "Tạo ảnh bằng AI",
                        en: "Generate images using AI"
                },
                category: "Image gen",
                guide: {
                        vi: "   {pn} <dấu nhắc>\n   Ví dụ: {pn} a beautiful sunset",
                        en: "   {pn} <prompt>\n   Example: {pn} a beautiful sunset"
                }
        },

        langs: {
                vi: {
                        noPrompt: "• Vui lòng nhập dấu nhắc (prompt)\n\nVí dụ: {pn} a beautiful sunset",
                        failed: "× Lỗi API: Liên hệ MahMUD để được trợ giúp.\n•WhatsApp: 01836298139",
                        error: "× Xin lỗi cục cưng, đã có lỗi xảy ra. 🥺",
                        result: "• Ảnh AI của bạn đã được tạo!\n\n• Prompt: %1\n\nPhản hồi tin nhắn này:\n1 = Ảnh 1\n2 = Ảnh 2\n3 = Ảnh 3\n4 = Ảnh 4\nall = Tất cả ảnh",
                        all: "• Đây là tất cả ảnh của bạn!",
                        single: "• Đây là ảnh %1"
                },
                en: {
                        noPrompt: "• Please provide a prompt\n\nExample: {pn} a beautiful sunset",
                        failed: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139",
                        error: "× Sorry baby, something went wrong. 🥺",
                        result: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐈𝐦𝐚𝐠𝐢𝐧𝐞 𝐈𝐦𝐚𝐠𝐞 <😘!\n\n•Reply to this message with 1, 2, 3, 4, or 'all' to get the full resolution image.",
                        all: "•  Here are all your images!",
                        single: "•  Here is image %1"
                }
        },

        onStart: async function ({ api, message, event, args, commandName, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const prefix = global.utils.getPrefix(event.threadID);
                const prompt = args.join(" ");

                if (!prompt) {
                        const invalidMsg = getLang("noPrompt").replace(/{pn}/g, prefix + this.config.name);
                        return api.sendMessage(invalidMsg, event.threadID, event.messageID);
                }

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        const result = await generateImagine(prompt);

                        if (!result) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return api.sendMessage(getLang("failed"), event.threadID, event.messageID);
                        }

                        return api.sendMessage({
                                body: getLang("result", prompt),
                                attachment: result.grid
                        }, event.threadID, (err, info) => {
                                if (!err) {
                                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                                        global.GoatBot.onReply.set(info.messageID, {
                                                commandName,
                                                author: event.senderID,
                                                paths: result.paths,
                                                cacheDir: result.cacheDir
                                        });
                                }
                        }, event.messageID);

                } catch (e) {
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return api.sendMessage(getLang("error"), event.threadID, event.messageID);
                }
        },

        onReply: async function ({ event, Reply, api, getLang }) {
                if (event.senderID !== Reply.author) return;

                const input = event.body.trim().toLowerCase();

                try {
                        if (input === "all") {
                                return api.sendMessage({
                                        body: getLang("all"),
                                        attachment: Reply.paths.map(p => fs.createReadStream(p))
                                }, event.threadID, event.messageID);
                        }

                        if (["1", "2", "3", "4"].includes(input)) {
                                const index = parseInt(input) - 1;
                                return api.sendMessage({
                                        body: getLang("single", input),
                                        attachment: fs.createReadStream(Reply.paths[index])
                                }, event.threadID, event.messageID);
                        }

                        global.GoatBot.onReply.delete(Reply.messageID);
                        setTimeout(() => {
                                fs.rmSync(Reply.cacheDir, { recursive: true, force: true });
                        }, 5000);

                } catch (e) {
                        return api.sendMessage(getLang("error"), event.threadID, event.messageID);
                }
        }
};

async function generateImagine(prompt) {
        try {
                const baseUrl = await baseApiUrl();
                const { data } = await axios.get(`${baseUrl}/api/imagine?prompt=${encodeURIComponent(prompt)}`);

                if (!data.success || !data.images?.length) return null;

                const cacheDir = path.join(__dirname, "cache", `imagine_${Date.now()}`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                const filePaths = [];

                for (let i = 0; i < Math.min(data.images.length, 4); i++) {
                        const base64 = data.images[i].replace(/^data:image\/\w+;base64,/, "");
                        const filePath = path.join(cacheDir, `img_${i + 1}.png`);
                        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
                        filePaths.push(filePath);
                }

                const images = await Promise.all(filePaths.map(loadImage));
                const { width, height } = images[0];

                const canvas = createCanvas(width * 2 + 20, height * 2 + 20);
                const ctx = canvas.getContext("2d");

                ctx.fillStyle = "#111";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const pos = [
                        { x: 10, y: 10 },
                        { x: width + 20, y: 10 },
                        { x: 10, y: height + 20 },
                        { x: width + 20, y: height + 20 }
                ];

                images.forEach((img, i) => {
                        ctx.drawImage(img, pos[i].x, pos[i].y, width, height);
                        ctx.fillStyle = "rgba(0,0,0,0.6)";
                        ctx.beginPath();
                        ctx.arc(pos[i].x + 35, pos[i].y + 35, 30, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = "#fff";
                        ctx.font = "bold 30px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(i + 1, pos[i].x + 35, pos[i].y + 35);
                });

                const gridPath = path.join(cacheDir, "grid.png");
                fs.writeFileSync(gridPath, canvas.toBuffer("image/png"));

                return { grid: fs.createReadStream(gridPath), paths: filePaths, cacheDir };
        } catch (error) {
                return null;
        }
        }
