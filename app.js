const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbpath = path.join(__dirname, "covid19India.db");
let db = null;
module.exports = app;
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
app.use(express.json());
initialize();

const changeformate = (list) => {
  let x = [];
  for (let i of list) {
    const obj = {
      stateId: i.state_id,
      stateName: i.state_name,
      population: i.population,
    };
    x.push(obj);
  }
  return x;
};

//1.Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const query = `
    select *
    from state
    `;

  const dbdata = await db.all(query);
  const body = changeformate(dbdata);
  response.send(body);
});

//2.Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
    select *
    from state
    where state_id = ${stateId}
    `;
  const dbdata = await db.get(query);
  const list = [dbdata];
  let body = changeformate(list);
  response.send(body[0]);
});

//3.Create a district in the district table

app.post("/districts/", async (request, response) => {
  const requestbody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestbody;
  const query = `
     insert into 
        district(district_name,state_id,cases,cured,active,deaths) 
     values
       ("${districtName}",${stateId},${cases},${cured},${active},${deaths})
    
    `;
  const dbbody = await db.run(query);
  response.send("District Successfully Added");
});

//4.Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    select *
    from district
    where district_id = ${districtId}
    `;

  const dbdata = await db.get(query);

  const changestyle = (dicti) => {
    return {
      districtId: dicti.district_id,
      districtName: dicti.district_name,
      stateId: dicti.state_id,
      cases: dicti.cases,
      cured: dicti.cured,
      active: dicti.active,
      deaths: dicti.deaths,
    };
  };
  const requestbody = changestyle(dbdata);
  //console.log("===============");
  //console.log(requestbody);
  response.send(requestbody);
});

//5.Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const del = `
        delete from 
            district
        where 
           district_id = ${districtId}
    `;
  const dbpostresponse = await db.run(del);
  response.send("District Removed");
});

//6.Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const add = `
       update 
           district
       set
          district_name= "${districtName}",
          state_id = ${stateId},
          cases = ${cases},
          cured = ${cured},
          active = ${active},
          deaths = ${deaths}
        where 
           district_id = ${districtId}
    `;
  const dbpostresponse = await db.run(add);
  response.send("District Details Updated");
});

//7.Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
     select 
        sum(cases) as  totalCases,
        sum(cured) as   totalCured,
        sum(active) as   totalActive,
        sum(deaths) as  totalDeaths 
    from district
    where
       state_id = ${stateId} 
    `;
  const dbdata = await db.get(query);
  response.send(dbdata);
});

//8.Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
     select state_name as stateName
     from state
     inner join district on district.state_id= state.state_id  
     where district_id = ${districtId}  `;
  const dbdata = await db.get(query);
  response.send(dbdata);
});
