const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000; // Adjust as needed


// Connect to MySQL database
const pool = mysql.createPool({
    host: "localhost",
    user: "rabah",
    password: "rabah",
    database: "car",
  });


app.use(express.static("public"))
app.use(express.urlencoded({extended : true}))
app.use(express.json())




// Endpoint 1: Get all models
app.get('/cars', async (req, res) => {
    
        try {
            const [rows] = await pool.query('SELECT * FROM models');
            console.log(rows);
        
            res.send(`
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-blue-500 text-white">
                        <th class="p-2">Id</th>
                        <th class="p-2">Name</th>
                        <th class="p-2">Cost</th>
                        <th class="p-2">Speed</th>
                        <th class="p-2">Fuel Eco</th>
                        <th class="p-2">Comfort</th>
                        <th class="p-2">Technology</th>
                        <th class="p-2">Maintenance</th>

                    </tr>
                </thead>
                <tbody>
                    ${rows.map((car) => `<tr><td>${car.id}</td><td>${car.name}</td><td>${car.cost}</td><td>${car.speed}</td><td>${car["Fuel Economy"]}</td><td>${car.Comfort}</td><td>${car["Technology features"]}</td><td>${car["maintenance costs"]}</td></tr>`).join("")}
                </tbody>
            </table>
            `)
        
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching models' });
          }
   });



app.post('/new', async(req,res) => {
    const { name, cost, speed , comfort ,technology ,fuel , maintenance} = req.body;
    try {
        await pool.query('INSERT INTO models ( `name`, `cost`, `speed`, `Fuel Economy`, `Comfort`, `Technology features`, `maintenance costs`) VALUES (?, ?, ? , ? , ?,?,?)', [name, cost, speed, fuel ,comfort ,technology  , maintenance]);
        res.send(`<p>Added ${name} succisfoly</p>`)
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating model' });
      } 
})

app.post('/delete',async(req, res) => {

  const id = req.body.id

  if (id) {
    const  s  = await pool.query(
      'DELETE FROM models WHERE id=?;', 
      [id]
    );

    const {affectedRows} = s
    console.log(affectedRows);
    if (affectedRows > 0) {
      res.send('<p id="deleteres">successfully</p>');
    } else {
      res.send('<p id="deleteres">Cant Delete</p>');    
    }

  } else {
    console.error(error);
    res.status(500).json({ message: 'Error creating model' });
  }

})

app.get('/find', async(req,res) => {
    const {  cost, speed } = req.query;
    console.log(cost);
    try {
        const [rows] = await pool.query('SELECT * FROM models WHERE cost=? OR speed=? ', [ cost, speed]);
        const row = Array.from(rows)
        console.log(row);

        if (row) {
            res.send(`<h1>We found a car for you : ${row.map((car) => `${car.name} `)}</h1>`)
        } else {
            res.send(`<p> Sorry cant find a car for you </p>`)
            
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating model' });
      } 
})

app.get('/topsis', async(req,res) => {
    const {  cost, speed } = req.query;
    try {
       console.log("-------------------TOPSIS----------------------");
        const [rows] = await pool.query('SELECT id,name,cost,speed,`Fuel Economy`, `Comfort`, `Technology features`, `maintenance costs` FROM models');
        console.log(rows);
        const step1a = rows.map(row => {
            return {
                id:row.id,
              name: row.name,
              cost: row.cost ** 2,
              speed: row.speed ** 2 ,
              fuel: row["Fuel Economy"] ** 2 ,
              comfort: row.Comfort ** 2 ,
              technology: row[`Technology features`] ** 2 ,
              maintenance: row[`maintenance costs`] ** 2 
            };
          });
        console.log("-------------------Step1a----------------------");
          console.log(step1a);
          let totalCost = step1a.reduce((sum, row) => {
            return sum + row.cost;
          }, 0);

          let totalSpeed = step1a.reduce((sum, row) => {
            return sum + row.speed;  
          }, 0);
          let totalFuel = step1a.reduce((sum, row) => {
            return sum + row.fuel;
          }, 0);
          let totalComfort = step1a.reduce((sum, row) => {
            return sum + row.comfort;
          }, 0);
          let totalTechnology = step1a.reduce((sum, row) => {
            return sum + row.technology;
          }, 0);
          let totalMaintenance = step1a.reduce((sum, row) => {
            return sum + row.maintenance;
          }, 0);



          totalCost = (totalCost ** (1/2)).toFixed(2)
          totalSpeed = (totalSpeed ** (1/2)).toFixed(2)

          const step1b = rows.map(row => {
            return {
                id:row.id,
              name: row.name,
              cost: row.cost / totalCost,
              speed: row.speed / totalSpeed 
            };
          });
       console.log("-------------------Step1b----------------------");
          
          console.log(step1b);

          
          const step2a = rows.map(row => {
              return {
                id:row.id,

                  name: row.name,
                  cost: row.cost * (cost / 10),
                  speed: row.speed * (speed / 10) 
                };
            });
            console.log("-------------------Step2a----------------------");

            
            console.log(step2a);
            


            
            //  min cost
            const costs = step2a.map(row => row.cost);
            const bestCost = Math.min(...costs);
            const worstCost = Math.max(...costs);
            
            
            // Get max speed
            const speeds = step2a.map(row => row.speed);  
            const bestSpeed = Math.max(...speeds);
            const worstSpeed = Math.min(...speeds);
            
            console.log("-------------------Best----------------------");
            console.log("Best Cost :"+bestCost + " || Best Speed :"+bestSpeed);
            console.log("-------------------Worst----------------------");
            console.log("Best Cost :"+worstCost + " || Best Speed :"+worstSpeed);


const step4a = rows.map(row => {
    return {
        id:row.id,
        name: row.name,
        cost: (row.cost - bestCost) ** 2,
        speed: (row.speed - bestSpeed) ** 2 
      };
  });

  console.log("-------------------Step4a----------------------");
  console.log(step4a);
  
  
  const best = step4a.map(row => {
      return {
          id:row.id,
          name: row.name,
          separation: (row.cost + row.speed) ** (1/2)
        };
    });
    console.log("-------------------Step4a Best----------------------");
    console.log(best); 
    
    const step4b = rows.map(row => {
        return {
            id:row.id,
            name: row.name,
            cost: (row.cost - worstCost) ** 2,
            speed: (row.speed - worstSpeed) ** 2 
        };
    });
    console.log("-------------------Step4b----------------------");
    console.log(step4b);
    const worst = step4b.map(row => {
        return {
            id:row.id,
            name: row.name,
            separation: (row.cost + row.speed) ** (1/2)
        };
    });
    console.log("-------------------Step4b Worst----------------------");
    console.log(worst);

  const C = worst.map(spRow => {

    const smRow = best.find(s => s.name === spRow.name);
    
    const divisor = spRow.separation + smRow.separation; 
    
    return {
        id:spRow.id,
        name : spRow.name,
        c : spRow.separation / divisor
    }; 
  
  });
  console.log("-------------------C----------------------");
  
  console.log(C);
const maxC = C.reduce((max, row) => {
  return row.c > max.c ? row : max;
}, {c: -Infinity});


console.log("-------------------Winner---------------------");

  console.log(maxC);



  const [Sugg] = await pool.query('SELECT * FROM models WHERE id=? ', [ maxC.id]);
const Sug = Sugg[0]

  
  if (Sug) {
      res.send(`<h1 class="text-2xl font-bold text-gray-500">We found a car for you :  <span class="text-green-800">${Sug.name}</span> with speed of  <span class="text-green-800">${Sug.speed}</span> and cost of  <span class="text-green-800">${Sug.cost}</span></h1>
     <a href="/index.html" class="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 mt-4">Retry</a> `)
  } else {
      res.send(`<p  class="text-red-500 font-bold"> Sorry cant find a car for you </p>
      <a href="/index.html" class="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 mt-4">Retry</a>
      `)
      
  }

      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating model' });
      } 
})






app.listen(port, () => { 
    console.log(`Server listening on port ${port}`);
  });
  