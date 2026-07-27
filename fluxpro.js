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
                name: "fluxpro",
                version: "2.7",
                author: "MahMUD",
                countDown: 15,
                role: 0,
                description: {
                        bn: "ফ্লাক্স প্রো মডেল দিয়ে উন্নত এআই ছবি তৈরি করুন",
                        en: "Generate high-quality AI images using Flux Pro model",
                        vi: "Tạo hình ảnh AI chất lượng cao bằng mô hình Flux Pro"
                },
                category: "image gen",
                guide: {
                        bn: '   {pn} <prompt> --ar <value>: ছবি তৈরি করতে বর্ণনা ও রেশিও দিন',
                        en: '   {pn} <prompt> --ar <value>: Provide description and ratio',
                        vi: '   {pn} <prompt> --ar <value>: Cung cấp mô tả và tỷ lệ'
                }
        },

        langs: {
                bn: {
                        noPrompt: "× বেবি, ছবি তৈরি করার জন্য কিছু তো লেখো!",
                        result: "• তোমার Flux Pro ছবি তৈরি হয়েছে!\n\n• Prompt: %1\n• Ratio: %2\n\nReply করো:\n1 = ছবি 1\n2 = ছবি 2\n3 = ছবি 3\n4 = ছবি 4\nall = সব ছবি",
                        all: "• এই নাও সব ছবি!",
                        single: "• এই নাও ছবি %1",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।\n•WhatsApp: 01836298139"
                },
                en: {
                        noPrompt: "× Baby, please provide a prompt to generate image!",
                        result: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐟𝐥𝐮𝐱 𝐩𝐫𝐨 𝐢𝐦𝐚𝐠𝐞𝐬 𝐛𝐚𝐛𝐲 <😘\n\n• Ratio: %2\n• Reply to this message with 1, 2, 3, 4, or 'all' to get the full resolution image.",
                        all: "• Here are all your images!",
                        single: "• Here is image %1",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noPrompt: "× Cưng ơi, vui lòng nhập mô tả để tạo ảnh!",
                        result: "• Ảnh Flux Pro của bạn đã được tạo!\n\n• Prompt: %1\n• Tỷ lệ: %2\n\nPhản hồi tin nhắn này:\n1 = Ảnh 1\n2 = Ảnh 2\n3 = Ảnh 3\n4 = Ảnh 4\nall = Tất cả ảnh",
                        all: "• Đây là tất cả ảnh của bạn!",
                        single: "• Đây là ảnh %1",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, args, message, getLang, commandName }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const fullArgs = args.join(" ");
                if (!fullArgs) return message.reply(getLang("noPrompt"));

                let prompt = fullArgs;
                let ratio = "1:1";
                let ratioDisplay = "Default";

                if (fullArgs.includes("--ar")) {
                        const parts = fullArgs.split("--ar");
                        prompt = parts[0].trim();
                        const customRatio = parts[1] ? parts[1].trim() : "";
                        if (customRatio) {
                                ratio = customRatio;
                                ratioDisplay = customRatio;
                        }
                }

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const result = await generateFluxProGrid(prompt, ratio);

                        if (!result) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("error", "Failed to fetch images"));
                        }

                        return api.sendMessage({
                                body: getLang("result", prompt, ratioDisplay),
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
                        console.error("Flux Pro Error:", e);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", e.message));
                }
        },

        onReply: async function ({ event, Reply, api, getLang }) {
                if (event.senderID !== Reply.author) return;

                const input = event.body.trim().toLowerCase();

                try {
                        if (input === "all") {
                                await api.sendMessage({
                                        body: getLang("all"),
                                        attachment: Reply.paths.map(p => fs.createReadStream(p))
                                }, event.threadID, event.messageID);
                        } else if (["1", "2", "3", "4"].includes(input)) {
                                const index = parseInt(input) - 1;
                                if (Reply.paths[index]) {
                                        await api.sendMessage({
                                                body: getLang("single", input),
                                                attachment: fs.createReadStream(Reply.paths[index])
                                        }, event.threadID, event.messageID);
                                }
                        } else {
                                return;
                        }

                        global.GoatBot.onReply.delete(Reply.messageID);
                        setTimeout(() => {
                                if (fs.existsSync(Reply.cacheDir)) {
                                        fs.rmSync(Reply.cacheDir, { recursive: true, force: true });
                                }
                        }, 5000);

                } catch (e) {
                        return api.sendMessage(getLang("error", e.message), event.threadID, event.messageID);
                }
        }
};

async function generateFluxProGrid(prompt, ratio) {
        try {
                const baseUrl = await baseApiUrl();
                const url = `${baseUrl}/api/fluxpro?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}`;

                const fetchPromises = [];
                for (let i = 0; i < 4; i++) {
                        fetchPromises.push(
                                axios.get(`${url}&rand=${Math.random()}`, { responseType: "arraybuffer", timeout: 120000 })
                                .then(res => res.data)
                        );
                }

                const results = await Promise.allSettled(fetchPromises);
                const successfulBuffers = results
                        .filter(r => r.status === 'fulfilled')
                        .map(r => r.value);

                if (successfulBuffers.length === 0) return null;

                const cacheDir = path.join(__dirname, "cache", `fluxpro_${Date.now()}`);
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                const filePaths = [];

                for (let i = 0; i < Math.min(successfulBuffers.length, 4); i++) {
                        const filePath = path.join(cacheDir, `img_${i + 1}.png`);
                        fs.writeFileSync(filePath, successfulBuffers[i]);
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
                console.error("Grid generation failed:", error);
                return null;
        }
}
