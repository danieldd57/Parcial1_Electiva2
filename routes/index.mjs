import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = express.Router();

const __dirname = path.resolve();

let ubicacionesDisponibles = {};

const loadUbicacionesData = async () => {
  try {
    const departmentsData = await fs.readFile(path.join(__dirname, 'resources', 'departments.json'), 'utf-8');
    const townsData = await fs.readFile(path.join(__dirname, 'resources', 'towns.json'), 'utf-8');

    const departments = JSON.parse(departmentsData);
    const towns = JSON.parse(townsData);

    const departmentMap = departments.reduce((acc, department) => {
      acc[department.code] = department.name;
      return acc;
    }, {});

    ubicacionesDisponibles = towns.reduce((acc, town) => {
      const departmentName = departmentMap[town.department];
      if (departmentName) {
        if (!acc[departmentName]) {
          acc[departmentName] = [];
        }
        acc[departmentName].push(town.name);
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error loading location data:", error);
  }
};

loadUbicacionesData();

const getUbicacionesRegistradas = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'resources', 'ubicaciones.json'), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Guarda los datos en el archivo ubicaciones.json
const saveUbicacionesRegistradas = async (ubicaciones) => {
    await fs.writeFile(path.join(__dirname, 'resources', 'ubicaciones.json'), JSON.stringify(ubicaciones, null, 2));
};

router.get('/', async (req, res) => {
    const { filtro } = req.query;
    const ubicaciones = await getUbicacionesRegistradas();
    let ubicacionesFiltradas = ubicaciones;

    if (filtro) {
        ubicacionesFiltradas = ubicaciones.filter(ubicacion => 
            ubicacion.departamento.toLowerCase().includes(filtro.toLowerCase()) || 
            ubicacion.municipio.toLowerCase().includes(filtro.toLowerCase())
        );
    }
    
    res.render('index.ejs', { "title": "Lista de Ubicaciones", "data": ubicacionesFiltradas, "ubicacionesDisponibles": ubicacionesDisponibles });
});

router.get('/new-pc', (req, res) => {
    res.render('add-record.ejs', { "title": "Nuevo Registro", "ubicacionesDisponibles": ubicacionesDisponibles });
});

router.post("/", async (req, res) => {
    const { fecha, departamento, municipio } = req.body;
    const nuevoRegistro = { fecha, departamento, municipio };
    
    const ubicaciones = await getUbicacionesRegistradas();
    ubicaciones.push(nuevoRegistro);
    await saveUbicacionesRegistradas(ubicaciones);

    res.redirect('/');
});

router.post('/delete', async (req, res) => {
    const { fecha, departamento, municipio } = req.body;
    const ubicaciones = await getUbicacionesRegistradas();
    
    const index = ubicaciones.findIndex(ubicacion => 
        ubicacion.fecha === fecha && 
        ubicacion.departamento === departamento && 
        ubicacion.municipio === municipio
    );

    if (index !== -1) {
        ubicaciones.splice(index, 1);
        await saveUbicacionesRegistradas(ubicaciones);
    }

    res.redirect('/');
});

export default router;