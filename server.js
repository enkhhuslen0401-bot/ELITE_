/**
 * ============================================================================
 * 🚀 ELITE CLAN PORTAL - ENTERPRISE BACKEND SERVER v5.3.3 (FINAL PRODUCTION)
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
            version: "5.3.3-PROD",
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1568511718768902385/WPMLa1YZjv_ZoCT068XeuEnryHX0A0ZCOaP-jdLbHQfrpomAXBZxG-E8igKgFXsdewsD',
            novacsApiKey: process.env.NOVACS_API_KEY || 'NVCS-45A1C1439811CBFE5808BC853F80613FE75D5F61',
            steamApiKey: process.env.STEAM_API_KEY || 'CBAA2149141064924A2EE0FEB60ADBFE',
            steamOpenIdEndpoint: 'https://steamcommunity.com/openid/login'
        };

        this.database = {
            applications: [],
            auditLogs: [],
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

        this.configureMiddleware();
        this.registerRoutes();
    }

    configureMiddleware() {
        this.app.use(express.json({ limit: '20mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '20mb' }));
        // index.html болон бусад файлууд шууд үндсэн root хавтсанд байгаа тул __dirname ашиглана
        this.app.use(express.static(__dirname));
    }

    registerRoutes() {
        // Нүүр хуудас дуудах үндсэн зам (ENOENT алдаанаас 100% сэргийлсэн)
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // Гишүүн нэмэх API
        this.app.post('/api/admin/add-member', (req, res) => {
            const { name, role, category, steamId } = req.body;
            if (!name || !steamId) {
                return res.status(400).json({ success: false, message: 'Нэр болон Steam ID шаардлагатай.' });
            }
            this.database.clanMembers.push({ name, role: role || 'ГИШҮҮН', category: category || 'main', steamId });
            res.status(200).json({ success: true, message: 'Гишүүн нэмэгдлээ!', roster: this.database.clanMembers });
        });

        // Кланы бүрэлдэхүүн авах API
        this.app.get('/api/clan/roster', (req, res) => {
            res.status(200).json({
                success: true,
                source: "Database Sync",
                total: this.database.clanMembers.length,
                roster: this.database.clanMembers
            });
        });

        // Steam Auth Login
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

        // Steam Auth Authenticate Callback
        this.app.get('/api/auth/steam/authenticate', async (req, res) => {
            const openidIdentity = req.query['openid.identity'];
            if (!openidIdentity) return res.redirect('/?error=steam_failed');

            const steamId = openidIdentity.split('/').pop();
            try {
                const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.config.steamApiKey}&steamids=${steamId}`;
                const response = await fetch(summaryUrl);
                const data = await response.json();
                const player = data.response?.players?.[0];
                res.redirect(`/?steamid=${steamId}&name=${encodeURIComponent(player?.personaname || 'Steam User')}`);
            } catch (err) {
                res.redirect(`/?steamid=${steamId}&name=SteamPlayer`);
            }
        });

        // Анкет илгээх болон Discord Webhook руу мэдээлэл явуулах
        this.app.post('/api/apply', async (req, res) => {
            try {
                const { discordTag, category, age, hours, faceit, premier, novaRank, prevClans, reason, steamId, steamName } = req.body;
                if (!discordTag || !category || !age || !reason || !steamId) {
                    return res.status(400).json({ success: false, message: 'Бүх талбарыг бөглөнө үү.' });
                }

                const bonusPoints = Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;
                const clanSlotCode = `NOVACS-SLOT-${Math.floor(100000 + Math.random() * 900000)}`;

                const application = {
                    id: this.database.applications.length + 1,
                    discordTag, category, age, hours, faceit, premier, novaRank,
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
                            { name: '🎂 Нас/Хүйс', value: `${age}`, inline: true },
                            { name: '⏱️ Цаг', value: `${hours || '0'} цаг`, inline: true },
                            { name: '🏆 FACEIT Level', value: `${faceit || 'N/A'}`, inline: true },
                            { name: '⭐ Premier ELO', value: `${premier || 'N/A'}`, inline: true },
                            { name: '🎯 Novacs Rank', value: `${novaRank || 'N/A'}`, inline: true },
                            { name: '🎁 Бонус Оноо', value: `+${bonusPoints.toLocaleString()} XP`, inline: true },
                            { name: '🎫 Слот Код', value: `\`${clanSlotCode}\``, inline: true },
                            { name: '💬 Шалтгаан', value: `>>> ${reason}`, inline: false }
                        ],
                        footer: { text: 'ELITE Clan Enterprise Automation' },
                        timestamp: new Date()
                    }]
                };

                await fetch(this.config.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(embed)
                });

                res.status(200).json({ success: true, clanSlotCode, bonusPoints });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Серверийн алдаа.' });
            }
        });

        this.app.get('/api/admin/applications', (req, res) => {
            res.status(200).json({ success: true, applications: this.database.applications });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`============================================================`);
            console.log(`🚀 ELITE BACKEND SERVER RUNNING ON PORT ${this.port}`);
            console.log(`🛡️ Integration: READY`);
            console.log(`============================================================`);
        });
    }
}

const server = new EliteBackendEnterpriseServer();
server.start();
