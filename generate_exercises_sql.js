const fs = require('fs');
const https = require('https');

const URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategory(muscles, categoryLabel) {
  if (categoryLabel === 'cardio') return 'Cardio';
  if (categoryLabel === 'stretching') return 'Stretching';
  
  const m = (muscles && muscles.length > 0) ? muscles[0].toLowerCase() : '';
  
  const pushMuscles = ['chest', 'shoulders', 'triceps'];
  const pullMuscles = ['lats', 'middle back', 'lower back', 'biceps', 'forearms', 'traps', 'neck'];
  const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'];
  const coreMuscles = ['abdominals'];

  if (pushMuscles.includes(m)) return 'Push';
  if (pullMuscles.includes(m)) return 'Pull';
  if (legMuscles.includes(m)) return 'Legs';
  if (coreMuscles.includes(m)) return 'Core';
  
  return 'Other';
}

https.get(URL, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  
  res.on('end', () => {
    const exercises = JSON.parse(data);
    
    let sql = `-- Massive Exercise Database (800+ Exercises)\n`;
    sql += `-- Generated from free-exercise-db\n\n`;
    sql += `INSERT INTO public.exercises (name, muscle_group, category, equipment, instructions, image_url) VALUES\n`;
    
    const values = [];
    
    exercises.forEach(ex => {
      // Escape single quotes for SQL
      const name = ex.name.replace(/'/g, "''");
      const muscle = ex.primaryMuscles && ex.primaryMuscles.length > 0 ? capitalize(ex.primaryMuscles[0]).replace(/'/g, "''") : 'Other';
      const category = getCategory(ex.primaryMuscles, ex.category);
      const equipment = ex.equipment ? capitalize(ex.equipment).replace(/'/g, "''") : 'Bodyweight';
      const instructions = ex.instructions ? ex.instructions.join(' ').replace(/'/g, "''") : '';
      const image_url = ex.images && ex.images.length > 0 ? IMAGE_BASE_URL + ex.images[0] : '';
      
      values.push(`('${name}', '${muscle}', '${category}', '${equipment}', '${instructions}', '${image_url}')`);
    });
    
    // Join with comma, and append ON CONFLICT DO NOTHING so it ignores duplicates if run multiple times
    sql += values.join(',\n') + `\nON CONFLICT (name) DO NOTHING;\n`;
    
    fs.writeFileSync('exercises_v2.sql', sql);
    console.log(`Successfully generated exercises_v2.sql with ${values.length} exercises!`);
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
