async function fetchMembers(env, guildId) {
    try {
        const baseUrl = "https://discord.com/api/v10";
        const response = await fetch(`${baseUrl}/guilds/${guildId}/members?limit=1000`, {
            headers: { "Authorization": `Bot ${env.DISCORD_BOT_TOKEN}` }
        });

        if (!response.ok) {
            console.error(`Discord API error: ${response.status} ${response.statusText}`);
            return { ok: false, status: response.status, statusText: response.statusText, members: [] };
        }
        
        // Note: Role '1270575756535267429' is 'Ypsilanti', and '1270575838995284029' is 'Hamtramck'
        const filteredMembers = (await response.json()).filter(member => member.roles.includes('1270575756535267429') || member.roles.includes('1270575838995284029'));
        const formattedMembers = filteredMembers.map(member => ({
            userId: member.user.id,
            nickname: member.nick ?? "",
            username: member.user.username,
            globalName: member.user.global_name,
            serverRoles: member.roles,
        }));

        return { ok: true, status: response.status, members: formattedMembers };
    } catch (error) {
        console.error("Error on fetchMembers():", error);
        return { ok: false, status: 0, members: [] };
    }
}

async function handleInteraction(body, env) {
    try {
        const guildId = body.guild_id;
        const result = await fetchMembers(env, guildId);

        return new Response(JSON.stringify({
            ok: result.ok,
            status: result.status,
            count: result.members.length,
            members: result.members
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({
           response: "Error on handleInteraction()",
           error: String(error)
        }), { status: 200 });
    }
}

export default {
    async fetch(request, env) {
        try {
            if (request.method !== "POST") {
                return new Response("OK", { status: 200 });
            }

            const json = await request.json();
            return await handleInteraction(json, env);
        } catch (error) {
            console.error("Uncaught error in fetch handler:", error);
            return new Response(JSON.stringify({
                response: `An unexpected error occurred on fetch(). Please try again later. Error: ${error}`
            }), { status: 500 });
        }
    }
};