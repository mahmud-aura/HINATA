const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "ffinfo",
                version: "3.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        en: "Get full Free Fire player information",
                        vi: "Lấy thông tin chi tiết người chơi Free Fire"
                },
                category: "info",
                guide: {
                        en: '   {pn} [UID]: Provide player UID',
                        vi: '   {pn} [UID]: Cung cấp UID người chơi'
                }
        },

        langs: {
                en: {
                        noUid: "• Please provide a Free Fire UID.\n\nexample: !ffinfo 404394256",
                        notFound: "× Player not found!",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noUid: "• Vui lòng cung cấp UID Free Fire.",
                        notFound: "× Không tìm thấy người chơi!",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);

                try {
                        const uid = args[0]; if (!uid) return message.reply(getLang("noUid"));
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);

                        const response = await axios.get(`${await baseApiUrl()}/api/mahmud/ffinfo?uid=${uid}`);
                        const data = response.data;

                        if (!data || !data.success || !data.message) { 
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(getLang("notFound")); 
                        }

                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                        return message.reply(data.message);

                } catch (err) {
                        console.error("error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        return message.reply(getLang("error", err.response?.data?.message || err.message));
                }
        }
};
