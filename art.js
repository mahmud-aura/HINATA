const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "art",
                aliases: ["artify", "photoart"],
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        en: "Transform your photo into various art styles",
                        bn: "আপনার ছবিকে বিভিন্ন আর্ট স্টাইলে রূপান্তর করুন",
                        vi: "Chuyển đổi ảnh của bạn thành nhiều phong cách nghệ thuật khác nhau"
                },
                category: "Image gen",
                guide: {
                        en: "{pn} [1-100] Reply to a photo or {pn} list",
                        bn: "{pn} [১-১০০] ছবিতে রিপ্লাই দিন) অথবা {pn} list",
                        vi: "{pn} [1-100] Phản hồi một ảnh hoặc {pn} list"
                }
        },

        langs: {
                bn: {
                        list_header: "✅ | 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐫𝐭 𝐒𝐭𝐲𝐥𝐞𝐬 𝐋𝐢𝐬𝐭:\n\n",
                        no_image: "• Baby, অনুগ্রহ করে একটি ছবিতে রিপ্লাই দিন।",
                        invalid_style: "❌ স্টাইল নম্বর অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে।",
                        generating: "🔄 | Applying art, please wait...\n• Style: %1\n• Style name: %2",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "✅ | Here's your art image baby\n• Style: %1\n• Style name: %2"
                },
                en: {
                        list_header: "✅ | 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐫𝐭 𝐒𝐭𝐲𝐥𝐞𝐬 𝐋𝐢𝐬𝐭:\n\n",
                        no_image: "• Baby, Please reply to a photo.",
                        invalid_style: "❌ Style number must be between 1 and 100.",
                        generating: "🔄 | Applying art, please wait...\n• Style: %1\n• Style name: %2",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "✅ | Here's your art image baby\n• Style: %1\n• Style name: %2"
                },
                vi: {
                        list_header: "✅ | 𝐃𝐚𝐧𝐡 𝐬á𝐜𝐡 𝐩𝐡𝐨𝐧𝐠 𝐜á𝐜𝐡 𝐧𝐠𝐡ệ 𝐭𝐡𝐮ậ𝐭:\n\n",
                        no_image: "📸 Vui lòng phản hồi một ảnh.",
                        invalid_style: "❌ Số kiểu phải từ 1 đến 100.",
                        generating: "🔄 | Applying art, please wait...\n• Style: %1\n• Style name: %2",
                        error: "❌ An error occurred: contact MahMUD %1",
                        success: "✅ | Here's your art image baby\n• Style: %1\n• Style name: %2"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { threadID, messageID } = event;
                const cacheDir = path.join(__dirname, "cache");
                const cachePath = path.join(cacheDir, `art_${threadID}_${Date.now()}.png`);
                let waitMsg;

                try {
                        const baseUrl = await baseApiUrl();
                        const apiEndpoint = `${baseUrl}/api/art`;

                        if (args[0] === "list") {
                                const res = await axios.get(`${apiEndpoint}/list`);
                                const styles = res.data.styles;
                                let text = getLang("list_header");
                                for (const key in styles) {
                                        text += `${key}: ${styles[key]}\n`;
                                }
                                return message.reply(text);
                        }

                        const replied = event.messageReply?.attachments?.[0];
                        if (!replied || replied.type !== "photo") {
                                return message.reply(getLang("no_image"));
                        }

                        const styleNum = parseInt(args[0] || "1");
                        if (isNaN(styleNum) || styleNum < 1 || styleNum > 100) {
                                return message.reply(getLang("invalid_style"));
                        }

                        const imageUrl = encodeURIComponent(replied.url);

                        let styleName = "Loading...";
                        try {
                                const listRes = await axios.get(`${apiEndpoint}/list`);
                                styleName = listRes.data.styles[styleNum] || "Custom Art";
                        } catch (e) {
                                styleName = "Art";
                        }

                        api.setMessageReaction("⏳", messageID, () => { }, true);
                        
                        waitMsg = await message.reply(getLang("generating", styleNum, styleName));

                        const res = await axios({
                                url: `${apiEndpoint}?imageUrl=${imageUrl}&style=${styleNum}`,
                                method: "GET",
                                responseType: "arraybuffer",
                                timeout: 180000
                        });

                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
                        fs.writeFileSync(cachePath, Buffer.from(res.data, "binary"));
                        
                        if (waitMsg) message.unsend(waitMsg.messageID);

                        const body = getLang("success", styleNum, styleName);

                        return message.reply({
                                body: body,
                                attachment: fs.createReadStream(cachePath)
                        }, () => { 
                                api.setMessageReaction("🪽", messageID, () => { }, true);
                                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); 
                        });

                } catch (err) {
                        if (waitMsg) message.unsend(waitMsg.messageID);
                        api.setMessageReaction("❌", messageID, () => { }, true);
                        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                        return message.reply(getLang("error", err.message || "API Error"));
                }
        }
};
