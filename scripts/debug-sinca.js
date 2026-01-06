
const fetch = require('node-fetch');

async function checkSinca() {
    try {
        const res = await fetch('https://sinca.mma.gob.cl/index.php/json/listadomapa2k19/');
        const data = await res.json();

        // Find a station in Santiago to inspect
        const station = data.find(s => s.nombre.includes("Parque O'Higgins") || s.key === "P. O'Higgins");

        if (station) {
            console.log("Station Found:", station.nombre);
            const realtime = station.realtime || [];
            const pm25 = realtime.find(r => r.code === 'PM25');

            if (pm25) {
                console.log("PM2.5 Info:", JSON.stringify(pm25.info, null, 2));
                if (pm25.info.rows.length > 0) {
                    const row = pm25.info.rows[pm25.info.rows.length - 1];
                    console.log("Latest Row:", row);
                    console.log("Tooltip:", row.c[3]?.v);
                }
            } else {
                console.log("No PM2.5 data found for this station.");
            }
        } else {
            console.log("Station not found.");
        }
    } catch (e) {
        console.error(e);
    }
}

checkSinca();
