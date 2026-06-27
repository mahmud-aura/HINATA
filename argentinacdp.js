const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
        config: {
                name: "argentinacdp",
                aliases: ["argcdp"],
                version: "1.7",
                author: "MahMUD",
                countDown: 5,
                role: 0,
                description: {
                        bn: "আর্জেন্টিনা কাপল প্রোফাইল পিকচার (CDP) পান",
                        en: "Get random Argentina couple profile pictures (CDP)"
                },
                category: "media",
                guide: {
                        bn: '   {pn}: রেন্ডম আর্জেন্টিনা কাপল ডিপি পেতে ব্যবহার করুন',
                        en: '   {pn}: Use to get random Argentina couple DP'
                }
        },

        langs: {
                bn: {
                        notFound: "⚠ এই ক্যাটাগরিতে কোনো ডিপি পাওয়া যায়নি।",
                        loadError: "❌ ছবিগুলো লোড করা সম্ভব হয়নি।",
                        success: "🇦🇷 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐫𝐚𝐧𝐝𝐨𝐦 𝐀𝐫𝐠𝐞𝐧𝐭𝐢𝐧𝐚 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲.",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।\n•WhatsApp: 01836298139"
                },
                en: {
                        notFound: "⚠ No DP found in this category.",
                        loadError: "❌ All image URLs failed to load.",
                        success: "🇦🇷 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐫𝐚𝐧𝐝𝐨𝐦 𝐀𝐫𝐠𝐞𝐧𝐭𝐢𝐧𝐚 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲.",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, message, event, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                try {
                        const apiBase = await mahmud();
                        const baseUrl = `${apiBase}/api/cdpvip2`;

                        const getStream = async (url) => {
                                const res = await axios({
                                        url,
                                        method: "GET",
                                        responseType: "stream",
                                        headers: { "User-Agent": "Mozilla/5.0" }
                                });
                                return res.data;
                        };

                        const category = "argentina";
                        const res = await axios.get(`${baseUrl}?category=${category}`);
                        const groupImages = res.data?.group || [];

                        if (!groupImages.length) return message.reply(getLang("notFound"));

                        const streamAttachments = [];
                        for (const url of groupImages) {
                                try {
                                        const stream = await getStream(url);
                                        streamAttachments.push(stream);
                                } catch (e) {
                                        console.warn(`⚠ Failed to load image: ${url}`);
                                }
                        }

                        if (!streamAttachments.length) return message.reply(getLang("loadError"));

                        return message.reply({
                                body: getLang("success"),
                                attachment: streamAttachments
                        });

                } catch (err) {
                        console.error("Full error:", err.response?.data || err.message);
                        return message.reply(getLang("error", err.message));
                }
        }
};
