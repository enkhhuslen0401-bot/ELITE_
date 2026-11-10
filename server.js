/**
 * ============================================================================
 * 🚀 ELITE ZONE PORTAL - ENTERPRISE BACKEND SERVER v5.7 (FINAL EDITION)
 * ============================================================================
 */

const express = require('express');
const path = require('path');

class EliteBackendEnterpriseServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        this.config = {
            appName: "ELITE ZONE PORTAL",
            version: "5.7.0-PROD",
            discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1568511718768902385/WPMLa1YZjv_ZoCT068XeuEnryHX0A0ZCOaP-jdLbHQfrpomAXBZxG-E8igKgFXsdewsD',
            steamApiKey: process.env.STEAM_API_KEY || 'CBAA2149141064924A2EE0FEB60ADBFE',
            steamOpenIdEndpoint: 'https://steamcommunity.com/openid/login'
        };

        this.database = {
            applications: [],
            clanMembers: [
                { id: 1, name: "anclous", role: "ГИШҮҮН MVP / DEVELOPER", category: "main", steamId: "76561199860386528" },
                { id: 2, name: "kaquya", role: "ГИШҮҮН", category: "main", steamId: "76561198000000002" },
                { id: 3, name: "Suhar1c kun", role: "ГИШҮҮН", category: "main", steamId: "76561198000000003" },
                { id: 4, name: "maGDr", role: "ГИШҮҮН / ШИЛДЭГ ФРАГГЕР", category: "main", steamId: "76561198000000004" },
                { id: 5, name: "Durex", role: "АХЛАГЧ", category: "main", steamId: "76561198000000006" },
                { id: 6, name: "Central", role: "ГИШҮҮН", category: "main", steamId: "76561198000000008" },
                { id: 7, name: "texr", role: "ГИШҮҮН", category: "main", steamId: "76561198000000009" },
                { id: 8, name: "Psychomuzikk.", role: "ДЭД АХЛАГЧ", category: "main", steamId: "76561198000000019" },
                { id: 9, name: "n0lixtap", role: "CONTENT CREATOR", category: "streamer", steamId: "76561198000000005" }
            ]
        };

        this.configureMiddleware();
        this.registerRoutes();
    }

    configureMiddleware() {
        this.app.use(express.json({ limit: '20mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '20mb' }));
        this.app.use(express.static(__dirname));
    }

    registerRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        this.app.post('/api/admin/add-member', (req, res) => {
            const { name, role, category, steamId } = req.body;
            if (!name || !steamId) {
                return res.status(400).json({ success: false, message: 'Нэр болон Steam ID шаардлагатай.' });
            }
            const newMember = {
                id: Date.now(),
                name,
                role: role || 'ГИШҮҮН',
                category: category || 'main',
                steamId
            };
            this.database.clanMembers.push(newMember);
            res.status(200).json({ success: true, message: 'Гишүүн амжилттай нэмэгдлээ!', roster: this.database.clanMembers });
        });

        this.app.delete('/api/admin/remove-member/:id', (req, res) => {
            const memberId = Number(req.params.id);
            this.database.clanMembers = this.database.clanMembers.filter(m => m.id !== memberId);
            res.status(200).json({ success: true, message: 'Гишүүн хасагдлаа!', roster: this.database.clanMembers });
        });

        this.app.get('/api/clan/roster', (req, res) => {
            res.status(200).json({
                success: true,
                total: this.database.clanMembers.length,
                roster: this.database.clanMembers
            });
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
                res.redirect(`/?steamid=${steamId}&name=${encodeURIComponent(player?.personaname || 'Steam User')}`);
            } catch (err) {
                res.redirect(`/?steamid=${steamId}&name=SteamPlayer`);
            }
        });

        this.app.post('/api/apply', async (req, res) => {
            try {
                const { discordUsername, category, age, hours, faceit, premier, novaRank, prevClans, reason, steamId, steamName } = req.body;
                if (!discordUsername || !category || !age || !reason || !steamId) {
                    return res.status(400).json({ success: false, message: 'Бүх шаардлагатай талбарыг бөглөнө үү.' });
                }

                let entranceFee = 10000;
                if (faceit && parseInt(faceit) >= 8) entranceFee = 5000;
                if (hours && parseInt(hours) > 3000) entranceFee -= 2000;

                const clanSlotCode = `NOVACS-SLOT-${Math.floor(100000 + Math.random() * 900000)}`;

                const application = {
                    id: this.database.applications.length + 1,
                    discordUsername, category, age, hours, faceit, premier, novaRank,
                    prevClans: prevClans || 'Байхгүй', reason, steamId,
                    steamName: steamName || 'Зочин',
                    entranceFee,
                    clanSlotCode,
                    date: new Date().toLocaleString()
                };

                this.database.applications.unshift(application);

                const embed = {
                    embeds: [{
                        title: '🎯 ELITE ZONE — ШИНЭ АНКЕТ БОЛОН СЛОТ ХҮСЭЛТ',
                        description: `**Discord Username:** \`${discordUsername}\`\n**Steam Name:** \`${application.steamName}\`\n**Steam ID:** \`${steamId}\``,
                        color: 16729429,
                        fields: [
                            { name: '📌 Баг', value: `\`${category}\``, inline: true },
                            { name: '🎂 Нас/Хүйс', value: `${age}`, inline: true },
                            { name: '⏱️ Цаг', value: `${hours || '0'} цаг`, inline: true },
                            { name: '🏆 FACEIT Level', value: `${faceit || 'N/A'}`, inline: true },
                            { name: '⭐ Premier ELO', value: `${premier || 'N/A'}`, inline: true },
                            { name: '💰 Хураамж', value: `**${entranceFee.toLocaleString()}₮**`, inline: true },
                            { name: '🎫 Слот Код', value: `\`${clanSlotCode}\``, inline: true },
                            { name: '💬 Шалтгаан', value: `>>> ${reason}`, inline: false }
                        ],
                        footer: { text: 'ELITE ZONE Enterprise Portal' },
                        timestamp: new Date()
                    }]
                };

                await fetch(this.config.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(embed)
                });

                res.status(200).json({ success: true, clanSlotCode, entranceFee });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
            }
        });

        this.app.get('/api/admin/applications', (req, res) => {
            res.status(200).json({ success: true, applications: this.database.applications });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`============================================================`);
            console.log(`🚀 ELITE ZONE SERVER RUNNING ON PORT ${this.port}`);
            console.log(`============================================================`);
        });
    }
}

const server = new EliteBackendEnterpriseServer();
server.start();
