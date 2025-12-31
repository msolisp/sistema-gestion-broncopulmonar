
async function fetchSinca() {
    try {
        const res = await fetch('https://sinca.mma.gob.cl/index.php/json/listadomapa2k19/');
        const data = await res.json();

        // Find Parque O'Higgins or Santiago generic
        const station = data.find((s: any) => s.nombre.includes("Parque O'Higgins") || s.key === 'D15');

        if (station) {
            console.log("Station:", station.nombre);
            const pm25 = station.realtime.find((r: any) => r.code === 'PM25');
            if (pm25) {
                console.log("PM2.5 Metadata:", JSON.stringify(pm25.info, null, 2));
                // Log last 3 rows
                const rows = pm25.info.rows;
                console.log("Last 3 rows:", rows.slice(-3));
            } else {
                console.log("No PM2.5 data found");
            }
        }
    } catch (e) {
        console.error(e);
    }
}

fetchSinca();
