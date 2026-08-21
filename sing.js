const axios = require("axios");

const baseApiUrl = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "sing",
                version: "3.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                description: {
                        en: "Search and download any song as an audio or video file",
                        vi: "Tìm kiếm và tải xuống bất kỳ bài hát nào dưới dạng tệp âm thanh hoặc video"
                },
                category: "music",
                guide: {
                        en: '   {pn} <song name>: To download audio\n   {pn} -v <video name>: To download video\n   {pn} -v2 <audio/video name>: To download via ytb api\n   {pn} -v3 <audio/video name>: To download via v3 api\n   {pn} -v4 <audio/video name>: To download via v4 api',
                        vi: '   {pn} <tên bài hát>: Tải âm thanh\n   {pn} -v <tên video>: Tải video\n   {pn} -v2 <tên>: Tải qua ytb api\n   {pn} -v3 <tên>: Tải qua v3 api\n   {pn} -v4 <tên>: Tải qua v4 api'
                }
        },

        langs: {
                en: {
                        noInput: "× Baby, please provide a song or video name.\nExample: {pn} Mood Lo-Fi, or {pn} -v Mood Lo-Fi",
                        success: "✅ | Here's your requested song baby <😘\n• 𝐒𝐨𝐧𝐠: %1",
                        videoSuccess: "✅ | Here's your requested video baby.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version2audio: "✅ | Here's your requested MP3 audio (v2) baby.\n• 𝐒𝐨𝐧𝐠: %1",
                        version2video: "✅ | Here's your requested video (v2) baby.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version3audio: "✅ | Here's your requested audio (v3) baby.\n• 𝐒𝐨𝐧𝐠: %1",
                        version3video: "✅ | Here's your requested video (v3) baby.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version4audio: "✅ | Here's your requested audio (v4) baby.\n• 𝐒𝐨𝐧𝐠: %1",
                        version4video: "✅ | Here's your requested video (v4) baby.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        noResult: "⭕ No search results match the keyword",
                        error: "× API error: %1. Contact MahMUD for help.\n•WhatsApp: 01836298139"
                },
                vi: {
                        noInput: "× Cưng ơi, vui lòng cung cấp tên bài hát hoặc video.\n\nVí dụ: {pn} shape of you hoặc {pn} -v shape of you",
                        success: "✅ | Bài hát của cưng đây <😘\n• 𝐁𝐚̀𝐢 𝐡𝐚́𝐭: %1",
                        videoSuccess: "✅ | Video của cưng đây.n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version2audio: "✅ | Âm thanh MP3 (v2) của cưng đây.\n• 𝐁𝐚̀𝐢 𝐡𝐚́𝐭: %1",
                        version2video: "✅ | Video (v2) của cưng đây.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version3audio: "✅ | Âm thanh (v3) của cưng đây.\n• 𝐁𝐚̀𝐢 𝐡𝐚́𝐭: %1",
                        version3video: "✅ | Video (v3) của cưng đây.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        version4audio: "✅ | Âm thanh (v4) của cưng đây.\n• 𝐁𝐚̀𝐢 𝐡𝐚́𝐭: %1",
                        version4video: "✅ | Video (v4) của cưng đây.\n• 𝐕𝐢𝐝𝐞𝐨: %1",
                        noResult: "⭕ Không có kết quả tìm kiếm nào phù hợp với từ khóa",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ.\n•WhatsApp: 01836298139"
                }
        },

        onStart: async function ({ api, event, args, message, getLang, commandName }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const { messageID } = event;
                const flags = ["-v", "video", "-v2", "version2", "-v3", "version3", "-v4", "version4"];

                if (!flags.includes(args[0])) {
                        const search = args.join(" ");
                        if (!search) return message.reply(getLang("noInput"));

                        try {
                                api.setMessageReaction("⌛", messageID, () => {}, true);
                                const downloadUrl = `${await baseApiUrl()}/api/sing?search=${encodeURIComponent(search)}&type=audio`;
                                const stream = await global.utils.getStreamFromURL(downloadUrl);

                                message.reply({
                                        body: getLang("success", search),
                                        attachment: stream
                                }, (error, info) => {
                                        api.setMessageReaction("🪽", event.messageID, (error) => {}, true);
                                });

                        } catch (error) {
                                console.error("Sing Error:", error);
                                api.setMessageReaction("❌", messageID, () => {}, true);
                                return message.reply(getLang("error", error.message));
                        }
                }
                
                else if (args[0] === "-v" || args[0] === "video") {
                        args.shift();
                        const search = args.join(" ");
                        if (!search) return message.reply(getLang("noInput"));

                        try {
                                api.setMessageReaction("⌛", messageID, () => {}, true);
                                const downloadUrl = `${await baseApiUrl()}/api/singv4?search=${encodeURIComponent(search)}&type=video`;
                                const stream = await global.utils.getStreamFromURL(downloadUrl);

                                message.reply({
                                        body: getLang("videoSuccess", search),
                                        attachment: stream
                                }, (error, info) => {
                                        api.setMessageReaction("🪽", event.messageID, (error) => {}, true);
                                });

                        } catch (error) {
                                console.error("Sing Video Error:", error);
                                api.setMessageReaction("❌", messageID, () => {}, true);
                                return message.reply(getLang("error", error.message));
                        }
                } 
                
                else if (args[0] === "-v2" || args[0] === "version2") {
                        args.shift();
                        let type = "audio";
                        
                        if (args.length > 0) {
                                switch (args[0]) {
                                        case "-v":
                                        case "video":
                                                type = "video";
                                                args.shift();
                                                break;
                                        case "-a":
                                        case "audio":
                                        case "sing":
                                                type = "audio";
                                                args.shift();
                                                break;
                                        default:
                                                break;
                                }
                        }

                        const search = args.join(" ");
                        if (!search) return message.reply(getLang("noInput"));

                        try {
                                api.setMessageReaction("⌛", messageID, () => {}, true);

                                const searchRes = await axios.get(`${await baseApiUrl()}/api/ytb/search?q=${encodeURIComponent(search)}`);
                                const results = searchRes.data.results;
                                if (!results || results.length === 0) return message.reply(getLang("error", type === "video" ? "No video found!" : "No audio found!"));

                                const videoID = results[0].id;
                                const realTitle = results[0].title;
                                const getRes = await axios.get(`${await baseApiUrl()}/api/ytb/get?id=${videoID}&type=${type}`);
                                const { downloadLink } = getRes.data.data;

                                const stream = await global.utils.getStreamFromURL(downloadLink);

                                message.reply({
                                        body: type === "video" ? getLang("version2video", realTitle) : getLang("version2audio", realTitle),
                                        attachment: stream
                                }, (error, info) => {
                                        api.setMessageReaction("🪽", event.messageID, (error) => {}, true);
                                });

                        } catch (error) {
                                console.error("Sing Audio V2 Error:", error);
                                api.setMessageReaction("❌", messageID, () => {}, true);
                                return message.reply(getLang("error", error.message));
                        }
                } 
                
                else if (args[0] === "-v3" || args[0] === "version3") {
                        args.shift();
                        let type = "audio";
                        
                        if (args.length > 0) {
                                switch (args[0]) {
                                        case "-v":
                                        case "video":
                                                type = "video";
                                                args.shift();
                                                break;
                                        case "-a":
                                        case "audio":
                                        case "sing":
                                                type = "audio";
                                                args.shift();
                                                break;
                                        default:
                                                break;
                                }
                        }

                        const search = args.join(" ");
                        if (!search) return message.reply(getLang("noInput"));

                        try {
                                api.setMessageReaction("⌛", messageID, () => {}, true);
                                const downloadUrl = `${await baseApiUrl()}/api/singv3?search=${encodeURIComponent(search)}${type === "video" ? '&type=video' : ''}`;
                                const stream = await global.utils.getStreamFromURL(downloadUrl);

                                message.reply({
                                        body: type === "video" ? getLang("version3video", search) : getLang("version3audio", search),
                                        attachment: stream
                                }, (error, info) => {
                                        api.setMessageReaction("🪽", event.messageID, (error) => {}, true);
                                });

                        } catch (error) {
                                console.error("Sing V3 Error:", error);
                                api.setMessageReaction("❌", messageID, () => {}, true);
                                return message.reply(getLang("error", error.message));
                        }
                } 
                
                else if (args[0] === "-v4" || (args.length > 0 && args[0] === "version4")) {
                        args.shift();
                        let type = "audio";
                        
                        if (args.length > 0) {
                                switch (args[0]) {
                                        case "-v":
                                        case "video":
                                                type = "video";
                                                args.shift();
                                                break;
                                        case "-a":
                                        case "audio":
                                        case "sing":
                                                type = "audio";
                                                args.shift();
                                                break;
                                        default:
                                                break;
                                }
                        }

                        const search = args.join(" ");
                        if (!search) return message.reply(getLang("noInput"));

                        try {
                                api.setMessageReaction("⌛", messageID, () => {}, true);
                                const downloadUrl = `${await baseApiUrl()}/api/singv4?search=${encodeURIComponent(search)}${type === "video" ? '&type=video' : ''}`;
                                const stream = await global.utils.getStreamFromURL(downloadUrl);

                                message.reply({
                                        body: type === "video" ? getLang("version4video", search) : getLang("version4audio", search),
                                        attachment: stream
                                }, (error, info) => {
                                        api.setMessageReaction("🪽", event.messageID, (error) => {}, true);
                                });

                        } catch (error) {
                                console.error("Sing V4 Error:", error);
                                api.setMessageReaction("❌", messageID, () => {}, true);
                                return message.reply(getLang("error", error.message));
                        }
                }
        }
};
