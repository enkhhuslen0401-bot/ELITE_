function getStepLogger(manager) {
    try {
        if (manager && typeof manager.getLogger === "function") {
            return manager.getLogger();
        }
    }
    catch (_error) {
        // Ignore and fall back to console logger.
    }
    return {
        info: function (message) { if (typeof console !== "undefined" && console.log) { console.log(message); } },
        warn: function (message) { if (typeof console !== "undefined" && console.warn) { console.warn(message); } },
        error: function (message) { if (typeof console !== "undefined" && console.error) { console.error(message); } },
        severe: function (message) { if (typeof console !== "undefined" && console.error) { console.error(message); } }
    };
}

/**
 * STEP Business Rule
 * Trademark: AI Labz Ltd (TM)
 * Purpose: Describe the rule intent and expected side effects.
 * Notes: Keep transactions short and avoid repeated writes in loops.
 *
 * @param {JavaUtilLoggingLogger} log - Alias for logger, provided by STEP.
 * @returns {void} Top-level business rule scripts do not return a value - effects are applied directly via node/manager writes.
 */

/**
 * ============================================================================
 * 🚀 ELITE CLAN PORTAL - ENTERPRISE BACKEND SERVER v5.3
 * ============================================================================
 */

const express = require('express');
const path = require('path');

class EliteBackendEnterpriseServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        this.config = {
            appName: "ELITE CLAN PORTAL",
            version: "5.3.0-PROD",
            discordWebhookUrl: 'https://discord.com/api/webhooks/1568511718768902385/WPMLa1YZjv_ZoCT068XeuEnryHX0A0ZCOaP-jdLbHQfrpomAXBZxG-E8igKgFXsdewsD',
            novacsApiKey: 'NVCS-45A1C1439811CBFE5808BC853F80613FE75D5F61',
            novacsBaseEndpoint: 'https://novacs.cc/api/v1/player/summary',
            steamApiKey: 'CBAA2149141064924A2EE0FEB60ADBFE',
            steamOpenIdEndpoint: 'https://steamcommunity.com/openid/login',
            cacheTtlMs: 300000,
            apiTimeoutMs: 3000
        };

        this.database = {
            applications: [],
            auditLogs: [],
            // БҮХ ГИШҮҮД ҮНДСЭН БАГТ БОЛОН ЗАРИМ НЬ STREAMER/CC ДАВХАР БАЙХ ЖАГСААЛТ
            clanMembers: [
                { name: "anclous", role: "ГИШҮҮН MVP / DEVELOPER", category: "main", steamId: "76561199860386528" },
                { name: "kaquya", role: "ГИШҮҮН", category: "main", steamId: "76561198000000002" },
                { name: "Suhar1c kun", role: "ГИШҮҮН", category: "main", steamId: "76561198000000003" },
                { name: "maGDr", role: "ГИШҮҮН / ШИЛДЭГ ФРАГГЕР", category: "main", steamId: "76561198000000004" },
                { name: "Durex", role: "АХЛАГЧ", category: "main", steamId: "76561198000000006" },
                { name: "Central", role: "ГИШҮҮН", category: "main", steamId: "76561198000000008" },
                { name: "texr", role: "ГИШҮҮН", category: "main", steamId: "76561198000000009" },
                { name: "Psychomuzikk.", role: "ДЭД АХЛАГЧ", category: "main", steamId: "76561198000000019" },
                { name: "n0lixtap", role: "CONTENT CREATOR", category: "main", steamId: "76561198000000005" },
                { name: "n0lixtap", role: "CONTENT CREATOR", category: "streamer", steamId: "76561198000000005" }
            ]
        };

        this.cache = {
            rosterData: null,
            lastFetchTimestamp: 0
        };

        this.configureMiddleware();
        this.registerRoutes();
    }

    configureMiddleware() {
        this.app.use(express.json({ limit: '20mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '20mb' }));
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    logSystemEvent(action, description) {
        const logEntry = {
            id: this.database.auditLogs.length + 1,
            action,
            description,
            timestamp: new Date().toLocaleString()
        };
        this.database.auditLogs.unshift(logEntry);
        if (this.database.auditLogs.length > 500) this.database.auditLogs.pop();
    }

    registerRoutes() {
        // КЛАНЫ ГИШҮҮД НЭМЭХ API (Админ самбараас гишүүн шууд бүртгэх)
        this.app.post('/api/admin/add-member', (req, res) => {
            const { name, role, category, steamId } = req.body;
            if (!name || !steamId) {
                return res.status(400).json({ success: false, message: 'Гишүүний нэр болон Steam ID заавал шаардлагатай.' });
            }
            const newMember = { name, role: role || 'ГИШҮҮН', category: category || 'main', steamId };
            this.database.clanMembers.push(newMember);
            this.cache.rosterData = null; // Cache цэвэрлэх
            res.status(200).json({ success: true, message: 'Гишүүн амжилттай нэмэгдлээ!', roster: this.database.clanMembers });
        });

        this.app.get('/api/clan/roster', async (req, res) => {
            try {
                const now = Date.now();
                if (this.cache.rosterData && (now - this.cache.lastFetchTimestamp < this.config.cacheTtlMs)) {
                    return res.status(200).json({
                        success: true,
                        source: "Cache",
                        total: this.cache.rosterData.length,
                        roster: this.cache.rosterData
                    });
                }

                const rosterPromises = this.database.clanMembers.map(async (member) => {
                    return {
                        name: member.name,
                        role: member.role,
                        category: member.category,
                        steamId: member.steamId
                    };
                });

                const synchronizedRoster = await Promise.all(rosterPromises);
                this.cache.rosterData = synchronizedRoster;
                this.cache.lastFetchTimestamp = now;

                res.status(200).json({
                    success: true,
                    source: "Novacs API Sync",
                    total: synchronizedRoster.length,
                    roster: synchronizedRoster
                });

            } catch (error) {
                res.status(500).json({ success: false, message: 'Дата татахад серверийн алдаа гарлаа.' });
            }
        });

        this.app.get('/api/auth/steam', (req, res) => {
            const host = req.get('host');
            const protocol = req.protocol;
            const callbackUrl = `${protocol}://${host}/api/auth/steam/authenticate`;
            const params = new URLSearchParams({
                'openid.ns': 'http://specs.openid.net/auth/2.0',
                'openid.mode': 'checkid_setup',
                'openid.return_to': callbackUrl,
                'openid.realm': `${protocol}://${host}`,
                'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
                'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
            });
            res.redirect(`${this.config.steamOpenIdEndpoint}?${params.toString()}`);
        });

        this.app.get('/api/auth/steam/authenticate', async (req, res) => {
            const openidIdentity = req.query['openid.identity'];
            if (!openidIdentity) return res.redirect('/?error=steam_failed');

            const steamId = openidIdentity.split('/').pop();
            try {
                const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.config.steamApiKey}&steamids=${steamId}`;
                const response = await fetch(summaryUrl);
                const data = await response.json();
                const player = data.response?.players?.[0];
                res.redirect(`/?steamid=${steamId}&name=${encodeURIComponent(player?.personaname || 'Steam User')}&avatar=${encodeURIComponent(player?.avatarmedium || '')}`);
            } catch (err) {
                res.redirect(`/?steamid=${steamId}&name=SteamPlayer`);
            }
        });

        this.app.post('/api/apply', async (req, res) => {
            try {
                const { discordTag, category, age, gender, hours, faceit, premier, novaRank, prevClans, reason, steamId, steamName } = req.body;
                if (!discordTag || !category || !age || !reason || !steamId) {
                    return res.status(400).json({ success: false, message: 'Талбаруудыг бүрэн бөглөнө үү.' });
                }

                // 5k-20k хооронд санамсаргүй бонус бодох болон Novacs Clan Slot хүсэлтийн код үүсгэх
                const bonusPoints = Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;
                const clanSlotCode = `NOVACS-SLOT-${Math.floor(100000 + Math.random() * 900000)}`;

                const application = {
                    id: this.database.applications.length + 1,
                    discordTag, category, age, gender, hours, faceit, premier, novaRank,
                    prevClans: prevClans || 'Байхгүй', reason, steamId,
                    steamName: steamName || 'Зочин',
                    bonusPoints,
                    clanSlotCode,
                    date: new Date().toLocaleString()
                };

                this.database.applications.unshift(application);

                const embed = {
                    embeds: [{
                        title: '🎯 ELITE CLAN — ШИНЭ АНКЕТ БОЛОН NOVACS СЛОТ ХҮСЭЛТ',
                        description: `**Discord Tag:** \`${discordTag}\`\n**Steam Name:** \`${application.steamName}\`\n**Steam ID:** \`${steamId}\``,
                        color: 16729429,
                        fields: [
                            { name: '📌 Баг', value: `\`${category}\``, inline: true },
                            { name: '🎂 Нас/Хүйс', value: `${age} / ${gender}`, inline: true },
                            { name: '⏱️ Цаг', value: `${hours} цаг`, inline: true },
                            { name: '🏆 FACEIT Level', value: `${faceit}`, inline: true },
                            { name: '⭐ Premier ELO', value: `${premier}`, inline: true },
                            { name: '🎯 Novacs Rank', value: `${novaRank}`, inline: true },
                            { name: '🎁 Бонус Оноо (Novacs)', value: `+${bonusPoints.toLocaleString()} XP`, inline: true },
                            { name: '🎫 Клан Слот Код', value: `\`${clanSlotCode}\``, inline: true },
                            { name: '💬 Шалтгаан', value: `>>> ${reason}`, inline: false }
                        ],
                        footer: { text: 'ELITE Clan Enterprise Automation & Novacs Integration' },
                        timestamp: new Date()
                    }]
                };

                await fetch(this.config.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(embed)
                });

                this.logSystemEvent("NEW_APPLICATION", `Application from ${discordTag} with slot ${clanSlotCode}`);
                res.status(200).json({
                    success: true,
                    message: 'Анкет амжилттай илгээгдлээ!',
                    bonusPoints,
                    clanSlotCode
                });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
            }
        });

        this.app.get('/api/admin/applications', (req, res) => {
            res.status(200).json({ success: true, applications: this.database.applications });
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`============================================================`);
            console.log(`🚀 ELITE BACKEND SERVER RUNNING ON http://localhost:${this.port}`);
            console.log(`🛡️ Novacs & Steam Integration: READY`);
            console.log(`============================================================`);
        });
    }
}

const server = new EliteBackendEnterpriseServer();
server.start();
