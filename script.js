document.addEventListener("DOMContentLoaded", function () {

    let characteristic;

    const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
    const CHAR_UUID = "abcdefab-1234-5678-1234-abcdefabcdef";

    const seatGrid = document.getElementById("seatGrid");

    // =====================
    // CREATE 40 SEATS
    // =====================
    function createSeats() {

    for (let row = 0; row < 10; row++) {

        for (let col = 0; col < 4; col++) {

            let seatNo = row * 4 + col + 1;

            let div = document.createElement("div");

            div.className = "seat occupied";
            div.id = "S" + seatNo;

            div.innerHTML = `
                <img class="seat-img" src="seat_red_png.png">
                <div class="belt-circle belt-off"></div>
            `;

            seatGrid.appendChild(div);

            /* Insert aisle after column 2 */
            if (col == 1) {

                let aisle = document.createElement("div");
                aisle.className = "aisle";

                seatGrid.appendChild(aisle);
            }
        }
    }
}

    createSeats();

    // =====================
    // BLE CONNECT
    // =====================
    window.connectBLE = async function () {

        try {

            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: "ESP32_SENSOR_DATA" }],
                optionalServices: [SERVICE_UUID]
            });

            const server = await device.gatt.connect();

            const service = await server.getPrimaryService(SERVICE_UUID);

            characteristic = await service.getCharacteristic(CHAR_UUID);

            await characteristic.startNotifications();

            characteristic.addEventListener(
                "characteristicvaluechanged",
                handleData
            );

            console.log("BLE Connected");

        }
        catch (err) {

            console.log("BLE Error:", err);

        }

    }

    // =====================
    // RECEIVE DATA
    // =====================
    function handleData(event) {

        let data = new TextDecoder().decode(event.target.value);

        console.log("RAW:", data);

        try {

            let parsed = JSON.parse(data);

            if (!Array.isArray(parsed)) return;

            parsed.forEach(item => {

                let seatId = item[0];
                let seatVal = item[1];
                let beltVal = item[2];

                let seat = document.getElementById(seatId);

                if (!seat) return;

                let img = seat.querySelector(".seat-img");
                let circle = seat.querySelector(".belt-circle");

                // Seat status
                if (seatVal == 1) {

                    seat.classList.remove("occupied");
                    seat.classList.add("empty");

                    img.src = "Seat_Green_png.png";

                }
                else {

                    seat.classList.remove("empty");
                    seat.classList.add("occupied");

                    img.src = "seat_red_png.png";

                }

                // Belt status
                circle.classList.remove("belt-on", "belt-off");

                if (beltVal == 1)
                    circle.classList.add("belt-on");
                else
                    circle.classList.add("belt-off");

            });

        }
        catch (e) {

            console.log("JSON Parse Error:", e);

        }

    }

});