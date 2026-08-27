const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "fun",
                aliases: ["dig", "funny"],
                version: "2.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                category: "fun",
                description: {
                        en: "Create funny images with various image effects",
                        vi: "Tạo ảnh hài hước với nhiều hiệu ứng hình ảnh khác nhau"
                },
                guide: {
                        en: '   {pn} [type] @mention: Generate with mentioned user' +
                                '\n   {pn} [type] [reply]: Generate with replied user' +
                                '\n   {pn} [type] [UID]: Provide a user ID' +
                                '\n   {pn} list: See all available effects',
                        vi: '   {pn} [type] @mention: Tạo với người được nhắc' +
                                '\n   {pn} [type] [reply]: Tạo với người đã trả lời' +
                                '\n   {pn} [type] [UID]: Cung cấp UID' +
                                '\n   {pn} list: Xem tất cả hiệu ứng'
                }
        },

        langs: {
                en: {
                        noType: "Provide a DIG type! Use 'fun list' to see all available effects.",
                        listFetchErr: "Failed to fetch the effects list.",
                        noTarget: "Please message reply or mention someone",
                        notFound: "× Effect not found\n• Type fun list to see available funny effects.",
                        error: "API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noType: "Vui lòng cung cấp loại hiệu ứng! Sử dụng 'fun list' để xem tất cả.",
                        listFetchErr: "Không thể tải danh sách hiệu ứng.",
                        noTarget: "Please message reply or mention someone",
                        notFound: "× Category not found\n• Type fun list to see available funny effects.",
                        error: "API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, usersData, args, getLang }) {
                const { threadID, messageID, messageReply, senderID, mentions } = event;

                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) return api.sendMessage("You are not authorized to change the author name.", threadID, messageID);

                const type = args[0]?.toLowerCase();

                if (!type) return api.sendMessage(getLang("noType"), threadID, messageID);
        
                if (type === "list") {
                        try {
                                const response = await axios.get(`${await mahmud()}/api/dig/list`);
                                let types = response.data.types || [];
                                return api.sendMessage(`• Available Funny Effects:\n\n${types.join(", ")}`, threadID, messageID);
                        } catch (error) {
                                return api.sendMessage(getLang("listFetchErr"), threadID, messageID);
                        }
                }

                let targetID;
                if (messageReply) {
                        targetID = messageReply.senderID;
                } else if (Object.keys(mentions).length > 0) {
                        targetID = Object.keys(mentions)[0];
                } else if (args[1]) {
                        targetID = args[1];
                }
                if (!targetID) return api.sendMessage(getLang("noTarget"), threadID, messageID);

                try {
                        api.setMessageReaction("⏳", messageID, () => { }, true);

                        let response;
                        try {
                           response = await axios.get(`${await mahmud()}/api/dig?type=${type}&user=${targetID}`, { responseType: "arraybuffer" });
                        } catch (error) {
                           if (error.response && error.response.status === 400) {
                                        try {
                       const errorJson = JSON.parse(error.response.data.toString());
                       const errString = (errorJson.error || "").toLowerCase();
                       if (errString.includes("not found") || errString.includes("invalid type")) {
                           api.setMessageReaction("❌", messageID, () => { }, true);
                           return api.sendMessage(getLang("notFound"), threadID, messageID);
                                  }
                          } catch (error) {}

                                   response = await axios.get(`${await mahmud()}/api/dig?type=${type}&user=${senderID}&user2=${targetID}`, { responseType: "arraybuffer" });
                          } else {
                                throw error; 
                             }
                        }

                        const isGif = ["trigger", "triggered"].includes(type);
                        const ext = isGif ? "gif" : "png";
            
                        const cacheDir = path.join(__dirname, "cache");
                        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                        const filePath = path.join(cacheDir, `fun_${Date.now()}.${ext}`);

                        fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

                        const targetData = await usersData.get(targetID);
                        const targetName = targetData.name || "User";

                        const finalBody = [
                                "It's just for fun, don't take it seriously. <🐸",
                                "",
                                `• Target: ${targetName}`,
                                `• Effect name: ${type.charAt(0).toUpperCase() + type.slice(1)}`
                        ].filter(Boolean).join("\n");

                        return api.sendMessage({
                                body: finalBody,
                                attachment: fs.createReadStream(filePath)
                        }, threadID, async () => {
                                api.setMessageReaction("🪽", messageID, () => { }, true);
                                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        }, messageID);

                } catch (error) {
                        api.setMessageReaction("❌", messageID, () => { }, true);
                        let errMsg = error.message;
                        if (error.response && error.response.data) {
                                try {
                        const errorJson = JSON.parse(error.response.data.toString());
                        const errString = (errorJson.error || "").toLowerCase();
                        if (errorJson.error) {
                        if (errString.includes("not found") || errString.includes("invalid type")) {
                        return api.sendMessage(getLang("notFound"), threadID, messageID);
                         }
                        errMsg = errorJson.error;
                                        }
                                } catch (error) {}
                        }
                        console.error(error);
                        return api.sendMessage(getLang("error", errMsg), threadID, messageID);
                }
        }
};
