// This script tests different query formats to find students in class 12 section A
import connection from './database/db_connection.js';

console.log('Testing different query formats for class 12 section A...');

// Test 1: Direct query with exact values
const query1 = `
  SELECT id, student_name, assigned_class, assigned_section 
  FROM students 
  WHERE assigned_class = ? AND assigned_section = ?
`;
connection.query(query1, ['12', 'A'], (err, results) => {
  if (err) {
    console.error('Error in Test 1:', err);
  } else {
    console.log('Test 1 (exact match 12/A):', results.length ? results : 'No results');
  }

  // Test 2: Try with 'class ' prefix
  const query2 = `
    SELECT id, student_name, assigned_class, assigned_section 
    FROM students 
    WHERE assigned_class = ? AND assigned_section = ?
  `;
  connection.query(query2, ['class 12', 'A'], (err, results) => {
    if (err) {
      console.error('Error in Test 2:', err);
    } else {
      console.log('Test 2 (class 12/A):', results.length ? results : 'No results');
    }

    // Test 3: Try with lowercase section
    const query3 = `
      SELECT id, student_name, assigned_class, assigned_section 
      FROM students 
      WHERE assigned_class = ? AND assigned_section = ?
    `;
    connection.query(query3, ['class 12', 'a'], (err, results) => {
      if (err) {
        console.error('Error in Test 3:', err);
      } else {
        console.log('Test 3 (class 12/a):', results.length ? results : 'No results');
      }

      // Test 4: Case-insensitive query
      const query4 = `
        SELECT id, student_name, assigned_class, assigned_section 
        FROM students 
        WHERE LOWER(assigned_class) LIKE LOWER(?) AND LOWER(assigned_section) = LOWER(?)
      `;
      connection.query(query4, ['%12%', 'A'], (err, results) => {
        if (err) {
          console.error('Error in Test 4:', err);
        } else {
          console.log('Test 4 (case-insensitive %12%/A):', results.length ? results : 'No results');
        }

        // Show all students to verify data
        connection.query(
          'SELECT id, student_name, assigned_class, assigned_section FROM students',
          (err, results) => {
            if (err) {
              console.error('Error fetching all students:', err);
            } else {
              console.log('\nAll students in database:');
              console.table(results);
            }
            
            connection.end();
          }
        );
      });
    });
  });
});
