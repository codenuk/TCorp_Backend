const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');
const projectRouter = express.Router(mergeParams=true);

projectRouter.use(bodyParser.json()); // support json encoded bodies
projectRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// A Project object represents each project that TCorp services throughout its lifetime. 

// ENDPOINTS
// + GET    /projects                            READ all Project objects
// GET    /projects/:tcorp_id                       READ a Project object with project id 'pid'
// POST   /projects                            CREATE a Project object
// PUT    /projects/:tcorp_id                       UPDATE a Project 'pid'
// DELETE /projects/:tcorp_id                       DELETE a Project 'pid'
// + GET    /projects/overview                   READ all Project objects for Overview
// GET    /projects/:tcorp_id/tasks                 READ all Task objects under Project 'pid'
// POST   /projects/tasks                 CREATE a Task under Project 'pid'
// PUT    /projects/:tcorp_id/tasks/:tid            UPDATE a Task 'tid' under Project 'pid'
// DELETE /projects/:tcorp_id/tasks/:seq_no            DELETE a Task 'tid' under Project 'pid'
// DELETE /projects/tasks/:tcorp_id                       DELETE a Task under Project 'pid'

// GET /project
projectRouter.get('/', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
       SELECT 
			project.id,
			project.tcorp_id,
			project.name_th,
			project.description,
			project.value,
			project.contract_id,
			project.end_contract_date,
			project.warranty_duration,
			project.billing_configuration_id,
			project.project_category_id,
            project.customer_id,
            project.sign_contract,
			project.is_aborted,
			project.is_template,
			project_category.type,
			customer.name AS customer_name,
			customer.fullname AS customer_fullname,
			customer.name_th AS customer_name_th,
			customer.fullname_th AS customer_fullname_th
		FROM
			project
				INNER JOIN
			project_category ON project.project_category_id = project_category.id
				INNER JOIN
			customer ON project.customer_id = customer.id
		ORDER BY project.id;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

// POST /projects
projectRouter.post('/', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique)
    // NON-REQUIRED:
    //   name_th, description, value, contract_id, end_contract_date, warranty_duration, billing_configuration_id, project_category_id, customer_id, is_aborted, is_template
    var projectInfo = req.body;
    var projectID = 0
    console.log(">>", projectInfo);
    db.query(`INSERT INTO project (${Object.keys(projectInfo).join()}) 
                        VALUES ?`, [[Object.values(projectInfo)]], function(err, result, fields) {
    if (err) throw err;
        projectID = result.insertId
        taskInfo = {
            "seq_no": 0,
            "group_no": 1,
            "task_status_id": 1, 
            "assigned_to_id": 1,
            "description": "ก่อนเซ็นสัญญา",
            "project_id": projectID,
            "is_header": 1,
            "ui_group_task": "down"
        }
        db.query(`INSERT INTO task (${Object.keys(taskInfo).join()}) 
        VALUES ?`, [[Object.values(taskInfo)]], function(err, result2, fields) {
            if (err) throw err;
                taskInfo = {
                    "seq_no": 1,
                    "group_no": 1,
                    "task_status_id": 0, 
                    "assigned_to_id": 1,
                    "deadline": "2019-08-14 00:00:00.000",
                    "updated_at": new Date(),
                    "description": "ตัวอย่าง",
                    "project_id": projectID,
                    "is_header": 0,
                    "ui_group_task": "down" 
                }
                db.query(`INSERT INTO task (${Object.keys(taskInfo).join()}) 
                VALUES ?`, [[Object.values(taskInfo)]], function(err, result2, fields) {
                    if (err) throw err;

                        taskInfo = {
                            "seq_no": 2,
                            "group_no": 2,
                            "task_status_id": 1, 
                            "assigned_to_id": 1,
                            "deadline": "2019-08-14 00:00:00.000",
                            "description": "หลังเซ็นสัญญา",
                            "project_id": projectID,
                            "is_header": 1,
                            "ui_group_task": "down" 
                        }
                        db.query(`INSERT INTO task (${Object.keys(taskInfo).join()}) 
                            VALUES ?`, [[Object.values(taskInfo)]], function(err, result, fields) {
                            if (err) throw err;
                            
                            taskInfo = {
                                "seq_no": 3,
                                "group_no": 3,
                                "task_status_id": 0, 
                                "assigned_to_id": 1,
                                "deadline": "2019-08-14 00:00:00.000",
                                "updated_at": new Date(),
                                "description": "ทีมช่าง",
                                "project_id": projectID,
                                "is_header": 1,
                                "ui_group_task": "down" 
                            }
                            db.query(`INSERT INTO task (${Object.keys(taskInfo).join()}) 
                                VALUES ?`, [[Object.values(taskInfo)]], function(err, result2, fields) {
                                if (err) throw err;
                                boqInfo = {
                                    "name": "BOQ_Test",
                                    "project_id": projectID
                                }

                                db.query(`INSERT INTO bill_of_quantity (${Object.keys(boqInfo).join()}) 
                                VALUES ?`, [[Object.values(boqInfo)]], function(err, result, fields) {
                                if (err) throw err;
                                    res.json({
                                        id: result.insertId
                                    });
                                });
                                        
                            });

                            
                        });
                });
        });

    });
})

// GET /project/overview
projectRouter.get('/overview', verifyToken, (req, res, next) => {
	db.query(`
		SELECT 
			project.id,
			project.tcorp_id,
			project.name_th,
			project.description,
			project.value,
			project.contract_id,
			project.end_contract_date,
			project.warranty_duration,
			project.billing_configuration_id,
			project.project_category_id,
			project.customer_id,
			project.is_aborted,
			project.is_template,
			project_category.type,
			customer.name AS customer_name,
			customer.fullname AS customer_fullname,
			customer.name_th AS customer_name_th,
			customer.fullname_th AS customer_fullname_th,
			total_tasks.no_total_tasks,
			total_finished.no_total_finished,
			(SELECT 
					task.description
				FROM
					task
						INNER JOIN
					task_status ON task.task_status_id = task_status.id
				WHERE
					task_status.status = 'เสร็จสมบูรณ์'
                        AND project.id = task.project_id
                        AND task.is_header = 0
				ORDER BY seq_no DESC
				LIMIT 1) AS task_prev,
			(SELECT 
					task.description
				FROM
					task
						INNER JOIN
					task_status ON task.task_status_id = task_status.id
				WHERE
					task_status.status = 'รอ'
                        AND project.id = task.project_id
                        AND task.is_header = 0
				ORDER BY deadline ASC
				LIMIT 1) AS task_next
		FROM
			project
				INNER JOIN
			project_category ON project.project_category_id = project_category.id
				INNER JOIN
			customer ON project.customer_id = customer.id
				LEFT OUTER JOIN
			(SELECT 
				project_id, COUNT(*) AS no_total_tasks
			FROM
				task
			GROUP BY project_id) total_tasks ON project.id = total_tasks.project_id
				LEFT OUTER JOIN
			(SELECT 
				project_id, COUNT(*) AS no_total_finished
			FROM
				task
			INNER JOIN task_status ON task.task_status_id = task_status.id
			WHERE
                task_status.status = 'เสร็จสมบูรณ์'
                AND task.is_header = 0
			GROUP BY project_id) total_finished ON project.id = total_finished.project_id
		ORDER BY project.id;`, function(err, result, fields){
		if (err) throw err;
            console.log(`This is the result: ${result}`);
        res.json(result);
	});
});

// GET /project/:id
projectRouter.get('/:tcorp_id', verifyToken, function(req, res, next) {
    // REQUIRED: 
    //   tcorp_id (Unique)

    var projectID = req.params.tcorp_id;
    db.query(`
        SELECT project.id, project.tcorp_id, project.customer_id, project.name_th, project.description, project.value, project.contract_id,
        project.end_contract_date, project.warranty_duration, project.billing_configuration_id, project.project_category_id, project.sign_contract, project.is_aborted, project.is_template, customer.name, project_category.type
        FROM ((project
        INNER JOIN
            customer ON project.customer_id = customer.id)
        INNER JOIN
            project_category ON project.project_category_id = project_category.id)
        WHERE
            tcorp_id = '${projectID}';`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


// PUT /projects/:tcorp_id
projectRouter.put('/:tcorp_id', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique)
    // NON-REQUIRED:
    //   name_th, description, value, contract_id, end_contract_date, warranty_duration, billing_configuration_id, project_category_id, customer_id, is_aborted, is_template
    var projectID = req.params.tcorp_id;
    var projectUpdateInfo = req.body;
    console.log("..", projectUpdateInfo)

    var update_set = Object.keys(projectUpdateInfo).map(value=>{
        return ` ${value}  = "${projectUpdateInfo[value]}"`;
    });
    sql = `UPDATE project SET ${update_set.join(" ,")} WHERE tcorp_id = "${projectID}"`
    db.query(sql, function (err, result) {
    if (err) throw err;
        res.json({
            tcorp_id: projectID,
            updateInfo: projectUpdateInfo
        });
    });
})

// DELETE /project/:id
projectRouter.delete('/:tcorp_id', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique)

    var TCorpID = req.params.tcorp_id;
    db.query(`
        DELETE FROM project WHERE tcorp_id="${TCorpID}"`, function (err, result) 
    {
    if (err) throw err;
        res.json({
            tcorp_id: TCorpID
        });
    });

})


// GET /projects/:tcorp_id/tasks
projectRouter.get('/:tcorp_id/tasks', verifyToken, (req, res, next) => {
    // REQUIRED: 
    //   tcorp_id (Unique)
    var projectID = req.params.tcorp_id;
    db.query(`
        SELECT 
            project.tcorp_id,
            project.name_th,
            project.customer_id,
            project.value,
            project.end_contract_date,
            task.seq_no,
            task.deadline,
            task.updated_at,
            task.group_no,
            task.assigned_to_id,
            task.description,
            task.task_status_id,
            task.is_header,
            task.ui_group_task,
            task_status.status,
            user.firstname,
            task.confirm_task
        FROM
            project
        INNER JOIN
            task ON project.id = task.project_id
        INNER JOIN
            task_status ON task.task_status_id = task_status.id
        INNER JOIN
            user ON task.assigned_to_id = user.id
        WHERE
            tcorp_id = '${projectID}'
        ORDER BY task.seq_no ASC;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


// POST /projects/tcorp_id/tasks
projectRouter.post('/tasks', verifyToken, function (req, res) {
    // REQUIRED: 
    //   project_id (Unique), seq_no, group_no
    // NON-REQUIRED:
    //   task_status_id, assigned_to_id, task_description_id
    var taskInfo = req.body;
    console.log("taskInfo", taskInfo)
    var tcorpID = taskInfo.tcorp_id;
    delete taskInfo.tcorp_id; 
    //taskInfo['deadline'] = db.escape(new Date(taskInfo.deadline));
    //taskInfo['updated_at'] = db.escape(new Date(taskInfo.updated_at));
    db.query(`INSERT INTO task (project_id,${Object.keys(taskInfo).join()})
                        VALUES ((SELECT id FROM project WHERE tcorp_id='${tcorpID}'),"${Object.values(taskInfo).join('","')}")`, function(err, result, fields) {
                        //VALUES (${Object.values(taskInfo).join()},)`, [[Object.values(taskInfo)]], function(err, result, fields) {
    if (err) throw err;
	    res.json({
            id: result.insertId
        });
    });
})


projectRouter.put('/:tcorp_id/tasks/:task_id', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique), task_id
    // NON-REQUIRED:
    var tcorpID = req.params.tcorp_id;
    var seqNO = req.params.task_id;
    var projectUpdateInfo = req.body;
    // var dateNow = new Date().toISOString() + 7;
    //var dateNow = new Date(Date.now()).toISOString();
    var dateNow = moment().utcOffset('+0700').format('YYYY-MM-DD HH:mm:ss');
    // dateNow = dateNow.toString();
    // console.log("dateNow", dateNow)
    // dateNow = dateNow.toISOString();
    // console.log("===== PUT TASKS ======")
    // console.log("seqNO", seqNO);
    // console.log("projectUpdateInfo", projectUpdateInfo);
    var action = projectUpdateInfo['action'];
    // console.log("action", action);
    if (projectUpdateInfo['action'] === "dragAndDropHandler") {
        delete projectUpdateInfo['action']
    }

    // console.log("#1", projectUpdateInfo)
    if (projectUpdateInfo['is_header'] === 1) {
        delete projectUpdateInfo['updated_at']
    }
    // console.log("#2", projectUpdateInfo)
    // console.log("NEw projectUpdateInfo", projectUpdateInfo);
    // console.log(typeof projectUpdateInfo[0], projectUpdateInfo[0]['task_status_id']);

    delete projectUpdateInfo['tcorp_id'];
    var update_set = Object.keys(projectUpdateInfo).map(value=>{
        return ` ${value}  = "${projectUpdateInfo[value]}"`;
    });
    // console.log("update_set", update_set)
    // If it has 'task_status_id' in Object, must append 'updated_at'
    // if `action !== undefined`: meaning is dragAndDropHandler , else : meaning is Normal Update
    if (projectUpdateInfo['task_status_id'] != null && action !== "dragAndDropHandler") {
        update_set.push(` updated_at = "${dateNow}"`);
    }

    // console.log(">>>>", update_set)
    sql = `UPDATE task SET ${update_set.join(" ,")} WHERE project_id = (SELECT id FROM project WHERE tcorp_id="${tcorpID}") AND seq_no = "${seqNO}"`
    // console.log("SQL:", sql)
    db.query(sql, function (err, result) {
    if (err) throw err;
        res.json({
            tcorp_id: tcorpID,
            seq_no: seqNO,
            updated_at: dateNow
        });
    });
})


// DELETE /:tcorp_id/tasks/:seq_no
projectRouter.delete('/:tcorp_id/tasks/:seq_no', verifyToken, function (req, res) {
    console.log("I AM DELETING FROM HERE!!!");
    var tcorpID = req.params.tcorp_id;
    var seqNO = req.params.seq_no;
    db.query(`
        DELETE FROM task 
        WHERE
            project_id=(SELECT id FROM project WHERE tcorp_id='${tcorpID}')
            AND seq_no=${seqNO};`, function (err, result) 
    {
        if (err) throw err;
        // Query all the task in that project where sequence number > seqNO, and replace it by seq_no-1
        db.query(`UPDATE task t1
        INNER JOIN 
        (SELECT id, seq_no-1 AS new_seq_no
        FROM task
        WHERE
            seq_no > ${seqNO}
            AND project_id = (SELECT id FROM project WHERE tcorp_id='${tcorpID}')) t2
            ON t1.id=t2.id
            SET t1.seq_no=t2.new_seq_no
            WHERE t1.project_id = (SELECT id FROM project WHERE tcorp_id='${tcorpID}')`, function(err,result){
            if(err) throw err;
            res.json({
                tcorp_id: tcorpID,
                seq_no: seqNO
	        });
        });

    });
})

// DELETE /tasks/:tcorp_id
projectRouter.delete('/tasks/:tcorp_id', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var seqNO = req.params.seq_no;
    db.query(`
        DELETE FROM task 
        WHERE
            project_id='${projectID}';`, function (err, result) 
    {
    if (err) throw err;
	    res.json({
            tcorp_id: projectID,
            seq_no: seqNO
        });
    });
})

module.exports = projectRouter;
