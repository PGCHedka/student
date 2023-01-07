const db = require('../models/postgres');

const adminController = {};

adminController.getTeachers = async (req, res, next) => {
  const grade = req.query.grade;
  try {
    const q = `SELECT t._id, t.first_name, t.last_name, SUM(c.time) AS "minutes"
       FROM tool.class_assignments c 
       JOIN tool.teachers t 
       ON c.teacher_id = t._id 
       WHERE c.date = NOW()::DATE
       AND t.grade_1 = ${grade} OR t.grade_2 = ${grade} OR t.grade_3 = ${grade}
       GROUP BY t._id`;
    const { rows } = await db.query(q);
    res.locals = rows;
    return next();
  } catch (err) {
    console.log(err);
    return next({
      log: `Error in adminController.getTeachers: ${err}`,
      status: 500,
      message: 'Cannot get teachers right now, sorry!',
    });
  }
};

adminController.addStudent = async (req, res, next) => {
  const { firstName, lastName, classes, grade } = req.body;
  try {
    const q = `INSERT INTO tool.students(first_name, last_name, grade) VALUES ($1, $2, $3) RETURNING *`;
    const values = [firstName, lastName, grade];
    const { rows } = await db.query(q, values);
    console.log(rows);
    const vals = `${rows[0]._id}, ${classes.join(`), (${rows[0]._id}, `)}`;
    console.log(vals);
    const q2 = `INSERT INTO tool.student_classes(student_id, class_id) VALUES (${vals})`;
    const r = await db.query(q).rows;
    console.log(r);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.addStudent: ${err}`,
      status: 500,
      message: 'Cannot add that student right now, sorry!',
    });
  }
};

adminController.addClass = async (req, res, next) => {
  const { name, description, teacher_id, grade } = req.body;
  try {
    const q = `INSERT INTO tool.classes(name, grade, teacher_id, description) VALUES ($1, $2, $3, $4)`;
    const values = [name, grade, teacher_id, description];
    const r = await db.query(q, values);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.addClass: ${err}`,
      status: 500,
      message: 'Cannot add that class right now, sorry!',
    });
  }
};

adminController.updateStudent = async (req, res, next) => {
  const { id, firstName, lastName, grade } = req.body;
  try {
    let q = `UPDATE tool.students SET `;
    if (firstName) q += `first_name = '${firstName}',`;
    if (lastName) q += `last_name = '${lastName}',`;
    if (grade) q += `grade = ${grade}`;
    if (q[q.length - 1] === ',') q = q.slice(0, q.length - 1) + ' ';
    q += `WHERE _id = ${id}`;
    await db.query(q);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.updateStudent: ${err}`,
      status: 500,
      message: 'This student does not want to be updated, sorry!',
    });
  }
};

adminController.updateStudentClasses = async (req, res, next) => {
  const { id, classes } = req.body;
  try {
    if (classes) {
      let q = `DELETE FROM tool.student_classes WHERE student_id = ${id}`;
      await db.query(q);
      let q2 = `INSERT INTO tool.student_classes(student_id, class_id) VALUES `;
      classes.forEach((x, i) => {
        if (i === classes.length - 1) q2 += `(${id}, ${x})`;
        else q2 += `(${id}, ${x}),`;
      });
      const r = await db.query(q2);
    }
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.updateStudentClasses: ${err}`,
      status: 500,
      message: 'This student wants to stay in their classes, sorry!',
    });
  }
};

adminController.deleteStudent = async (req, res, next) => {
  const { id } = req.body;
  try {
    const q = `DELETE FROM tool.students WHERE _id = ${id}`;
    const r = await db.query(q);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.deleteStudent: ${err}`,
      status: 500,
      message: 'This student does not want to be deleted, sorry!',
    });
  }
};

adminController.getStudent = async (req, res, next) => {
  const id = Number(req.query.student_id);
  console.log(req.query);
  console.log(id);
  try {
    const q = `SELECT * FROM tool.students WHERE _id = ${id}`;
    const { rows } = await db.query(q);
    res.locals = rows[0];
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.getStudent: ${err}`,
      status: 500,
      message: 'We cannot find this student, sorry!',
    });
  }
};

adminController.getStudents = async (req, res, next) => {
  const grade = req.query.grade;
  try {
    let q = `SELECT * FROM tool.students `;
    if (grade) q += `WHERE grade = ${grade}`;
    const { rows } = await db.query(q);
    res.locals = rows;
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.getStudents: ${err}`,
      status: 500,
      message: 'We cannot find this student, sorry!',
    });
  }
};

adminController.getTeacher = async (req, res, next) => {
  const id = Number(req.query.teacher_id);
  console.log(id);
  try {
    const q = `SELECT * FROM tool.teachers WHERE _id = ${id}`;
    const rows = await db.query(q);
    res.locals = rows[0];
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.getTeacher: ${err}`,
      status: 500,
      message: 'We cannot find this teacher, sorry!',
    });
  }
};

adminController.updateTeacher = async (req, res, next) => {
  const { id, firstName, lastName, grade1, grade2, grade3 } = req.body;
  console.log(req.body);
  try {
    let q = `UPDATE tool.teachers SET `;
    if (firstName) q += `first_name = '${firstName}',`;
    if (lastName) q += `last_name = '${lastName}', `;
    if (grade1) q += `grade_1 = ${grade1},`;
    if (grade2) q += `grade_2 = ${grade2},`;
    if (grade3) q += `grade_3 = ${grade3} `;
    if (q[q.length - 1] === ',') q = q.slice(0, q.length - 1) + ' ';
    q += `WHERE _id = ${id}`;
    console.log(q);
    const r = await db.query(q);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.updateTeacher: ${err}`,
      status: 500,
      message: 'They would prefer not to be updated, sorry!',
    });
  }
};

adminController.deleteTeacher = async (req, res, next) => {
  const { id } = req.body;
  try {
    const q = `DELETE FROM tool.teachers WHERE _id = $1`;
    const vals = [id];
    const r = await db.query(q, vals);
    console.log(r);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.deleteTeacher: ${err}`,
      status: 500,
      message: 'That teacher is here to stay, sorry!',
    });
  }
};

adminController.updateClass = async (req, res, next) => {
  const { id, name, description, teacher_id, grade } = req.body;
  try {
    let q = `UPDATE tool.classes SET `;
    if (name) q += `name = '${name}',`;
    if (description) q += `description = '${description}', `;
    if (teacher_id) q += `teacher_id = ${teacher_id},`;
    if (grade) q += `grade = ${grade},`;
    if (q[q.length - 1] === ',') q = q.slice(0, q.length - 1) + ' ';
    q += `WHERE _id = ${id}`;
    console.log(q);
    const r = await db.query(q);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.updateClass: ${err}`,
      status: 500,
      message: 'That teacher is here to stay, sorry!',
    });
  }
};

adminController.deleteClass = async (req, res, next) => {
  const { id } = req.body;
  try {
    const q = `DELETE FROM tool.classes WHERE _id = $1`;
    const vals = [id];
    const r = await db.query(q, vals);
    console.log(r);
    return next();
  } catch (err) {
    return next({
      log: `Error in adminController.deleteClass: ${err}`,
      status: 500,
      message: 'That teacher is here to stay, sorry!',
    });
  }
};
module.exports = adminController;
