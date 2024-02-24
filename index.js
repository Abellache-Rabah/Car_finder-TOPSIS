const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000; // Adjust as needed

// Connect to MySQL database
const pool = mysql.createPool({
  host: "localhost",
  user: "rabah",
  password: "rabah",
  database: "car",
  port: 4306,
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint 1: Get all models
app.get("/cars", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM cars");

    res.send(`
    <div class="flex flex-col">
    <div class="-m-1.5 overflow-x-auto">
    <div class="p-1.5 min-w-full inline-block align-middle">
    <div class="overflow-hidden">
                <table class="w-full text-leftmin-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                    <tr class="bg-blue-500 text-white">
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Id</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Name</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium uppercase">Cost</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Speed</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Fuel Eco</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Comfort</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Technology</th>
                    <th scope="col" class="px-6 py-3 text-start text-xs font-medium  uppercase">Maintenance Cost</th>
                    
                    </tr>
                </thead>
                <tbody>
                    ${rows
                      .map(
                        (car) =>
                          `<tr class="odd:bg-white even:bg-gray-100 dark:odd:bg-slate-900 dark:even:bg-slate-800"><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.id}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.name}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.cost}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.speed}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.fuel}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.comfort}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.technology}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">${car.maintenance}</td></tr>`
                      )
                      .join("")}
                </tbody>
            </table>
            </div>
            </div>
            </div>
            </div>
            `);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching models" });
  }
});

app.post("/new", async (req, res) => {
  const { name, cost, speed, comfort, technology, fuel, maintenance } =
    req.body;
  try {
    await pool.query(
      "INSERT INTO cars ( `name`, `cost`, `speed`, `fuel`, `comfort`, `technology`, `maintenance`) VALUES (?, ?, ? , ? , ?,?,?)",
      [name, cost, speed, fuel, comfort, technology, maintenance]
    );
    res.send(`<p>Added ${name} succisfoly</p>`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating model" });
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.id;
  if (id) {
    const s = await pool.query("DELETE FROM cars WHERE id=?;", [id]);

    const { affectedRows } = s;
    console.log(affectedRows);
    if (affectedRows > 0) {
      res.send('<p id="deleteres">successfully</p>');
    } else {
      res.send('<p id="deleteres">Cant Delete</p>');
    }
  } else {
    console.error(error);
    res.status(500).json({ message: "Error creating model" });
  }
});

function dev(value, total) {
  return total === 0 ? 0 : Number((value / total).toFixed(5));
}

app.get("/topsis", async (req, res) => {
  const { cost, speed, comfort, technology, fuel, maintenance } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT id,name,cost,speed,`fuel`, `comfort`, `technology`, `maintenance` FROM cars"
    );

    const step1a = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        cost: row.cost ** 2,
        speed: row.speed ** 2,
        fuel: row.fuel ** 2,
        comfort: row.comfort ** 2,
        technology: row.technology ** 2,
        maintenance: row.maintenance ** 2,
      };
    });

    console.log(step1a);
    console.log("----------------------------------------------------");
    const attrs = [
      "cost",
      "speed",
      "fuel",
      "comfort",
      "technology",
      "maintenance",
    ];
    const totals = {};
    attrs.forEach((attr) => {
      totals[attr] = step1a.reduce((sum, row) => {
        return sum + row[attr];
      }, 0);
      totals[attr] = Math.round(Math.sqrt(totals[attr]) * 100) / 100;
    });

    console.log(totals);
    console.log("----------------------------------------------------");

    const step1b = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        cost: dev(row.cost, totals.cost),
        speed: dev(row.speed, totals.speed),
        fuel: dev(row.fuel, totals.fuel),
        comfort: dev(row.comfort, totals.comfort),
        technology: dev(row.technology, totals.technology),
        maintenance: dev(row.maintenance, totals.maintenance),
      };
    });

    console.log(step1b);
    console.log("----------------------------------------------------");

    const step2a = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        cost: Number((row.cost * (cost / 10)).toFixed(5)),
        speed: Number((row.speed * (speed / 10)).toFixed(5)),
        fuel: Number((row.fuel * (fuel / 10)).toFixed(5)),
        comfort: Number((row.comfort * (comfort / 10)).toFixed(5)),
        technology: Number((row.technology * (technology / 10)).toFixed(5)),
        maintenance: Number((row.maintenance * (maintenance / 10)).toFixed(5)),
      };
    });

    console.log(step2a);
    console.log("----------------------------------------------------");

    //  min  max cost
    const costs = step2a.map((row) => row.cost);
    const bestCost = Math.min(...costs);
    const worstCost = Math.max(...costs);

    // min max speed
    const speeds = step2a.map((row) => row.speed);
    const bestSpeed = Math.max(...speeds);
    const worstSpeed = Math.min(...speeds);

    // min max fuel
    const fuels = step2a.map((row) => row.fuel);
    const bestFuel = Math.max(...fuels);
    const worstFuel = Math.min(...fuels);

    // min max comfort
    const comforts = step2a.map((row) => row.comfort);
    const bestComfort = Math.max(...comforts);
    const worstComfort = Math.min(...comforts);

    // min max technology
    const technologies = step2a.map((row) => row.technology);
    const bestTechnology = Math.max(...technologies);
    const worstTechnology = Math.min(...technologies);

    // min max maintenance
    const maintenances = step2a.map((row) => row.maintenance);
    const bestMaintenance = Math.min(...maintenances);
    const worstMaintenance = Math.max(...maintenances);

    console.log("-------------------Best----------------------");
    console.log(
      "Best Cost :" +
        bestCost +
        " || Best Speed :" +
        bestSpeed +
        " || Best Fuel :" +
        bestFuel +
        " || Best Comfort :" +
        bestComfort +
        " || Best Technology :" +
        bestTechnology +
        " || Best Maintenance :" +
        bestMaintenance
    );
    console.log("-------------------Worst----------------------");
    console.log(
      "worst Cost :" +
        worstCost +
        " || worst Speed :" +
        worstSpeed +
        " || worst Fuel :" +
        worstFuel +
        " || worst Comfort :" +
        worstComfort +
        " || worst Technology :" +
        worstTechnology +
        " || worst Maintenance :" +
        worstMaintenance
    );
    console.log("-------------------------------------------------");

    const step4a = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        cost: bestCost !== row.cost ? (row.cost - bestCost) ** 2 : 0,
        speed: bestSpeed !== row.speed ? (row.speed - bestSpeed) ** 2 : 0,
        fuels: bestFuel !== row.fuel ? (row.fuel - bestFuel) ** 2 : 0,
        comfort:
          bestComfort !== row.comfort ? (row.comfort - bestComfort) ** 2 : 0,
        technology:
          bestTechnology !== row.technology
            ? (row.technology - bestTechnology) ** 2
            : 0,
        maintenance:
          bestMaintenance !== row.maintenance
            ? (row.maintenance - bestMaintenance) ** 2
            : 0,
      };
    });

    console.log(step4a);
    console.log("----------------------------------------------------");
    let best = step4a.map((car) => {
      let sum =
        car.cost +
        car.speed +
        car.fuels +
        car.comfort +
        car.technology +
        car.maintenance;

      if (isNaN(sum) || sum === Infinity || sum === -Infinity || sum === -0) {
        sum = 0;
      }

      return {
        id: car.id,
        name: car.name,
        separation: sum,
      };
    });

    console.log(best);
    console.log("----------------------------------------------------");

    const step4b = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        cost: bestCost !== row.cost ? (row.cost - worstCost) ** 2 : 0,
        speed: bestSpeed !== row.speed ? (row.speed - worstSpeed) ** 2 : 0,
        fuels: bestFuel !== row.fuel ? (row.fuel - worstFuel) ** 2 : 0,
        comfort:
          bestComfort !== row.comfort ? (row.comfort - worstComfort) ** 2 : 0,
        technology:
          bestTechnology !== row.technology
            ? (row.technology - worstTechnology) ** 2
            : 0,
        maintenance:
          bestMaintenance !== row.maintenance
            ? (row.maintenance - worstMaintenance) ** 2
            : 0,
      };
    });

    console.log(step4b);
    console.log("----------------------------------------------------");
    let worst = step4b.map((car) => {
      let sum =
        car.cost +
        car.speed +
        car.fuels +
        car.comfort +
        car.technology +
        car.maintenance;

      if (isNaN(sum) || sum === Infinity || sum === -Infinity || sum === -0) {
        sum = 0;
      }

      return {
        id: car.id,
        name: car.name,
        separation: sum,
      };
    });

    console.log(worst);
    console.log("----------------------------------------------------");

    const C = worst.map((spRow) => {
      const smRow = best.find((s) => s.id === spRow.id);

      const divisor = spRow.separation + smRow.separation;

      if (divisor === 0) {
        return { id: spRow.id, name: spRow.name, c: 0 };
      } else {
        return {
          id: spRow.id,
          name: spRow.name,
          c: spRow.separation / divisor,
        };
      }
    });
    console.log("-------------------C----------------------");
    console.log(C);

    const maxC = C.reduce(
      (max, row) => {
        return row.c > max.c ? row : max;
      },
      { c: -Infinity }
    );

    console.log("-------------------Winner---------------------");

    console.log(maxC);

    const [Sugg] = await pool.query("SELECT * FROM models WHERE id=? ", [
      maxC.id,
    ]);
    const Sug = Sugg[0];

    if (Sug) {
      res.send(`<h1 class="text-2xl font-bold text-gray-500">We found a car for you :  <span class="text-green-800">${Sug.name}</span> with speed of  <span class="text-green-800">${Sug.speed}</span> and cost of  <span class="text-green-800">${Sug.cost}</span></h1>
     <a href="/index.html" class="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 mt-4">Retry</a> `);
    } else {
      res.send(`<p  class="text-red-500 font-bold"> Sorry cant find a car for you </p>
      <a href="/index.html" class="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 mt-4">Retry</a>
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating model" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
