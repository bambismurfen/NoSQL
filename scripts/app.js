var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var branches = {branches:[]};
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var way = "D:/db/NoSQL";
var fetch = require('./fetch.js');
var insertDB = require('./insertAndUpdate.js');
var orders = {cashier:"",branch:"", orders:[]};
var branch;
comment = {boss:"", cashier:"", comment:"", branch:""};
app.set('view engine', 'ejs');
function addToOrder(object, res){
    var x = orders.orders.length;
    orders.orders.push({number:orders.orders.length, name:object.name, amount:object.amount});
    console.log(orders);
    console.log("app.js, addToOrder, the object passed trough as a parameter:\n"+orders);
    res.render('cashier', {cashier: orders.cashier, orders: getOrders()});
}
//function to return the orders object.
function getOrders(){
    return orders;
}
//this will be used to clear the orders, might look slightly different later on.
function clearOrder(){
    orders = {cashier:orders.cashier,branch:orders.branch, orders:[]};;
}

//helps us get the pictures and css from the folders /styles and /images so the
//.ejs files may be renderd properly.
app.use('/styles', express.static('styles'));
app.use('/images', express.static('images'));
app.use('/scripts', express.static('scripts'));

//POST function used by the form in locationmanager.ejs,
//the choises in the form are extracted trough req (request)
app.post('/branchNames',urlencodedParser, function(req, res) {
    var selectedId = req.body.branchName;
    var selectedReport = req.body.reportSelect;
    console.log(selectedId);
    console.log(selectedReport);
    console.log("app.js, post, branchNames");
    if(req.body.reportSelect==="sales_time"){
        fetch.getTheOrders(selectedId, res, createDateArray);
        //sales during time
        /*
        righty o, send this fucker to the database, just fetch the fucking orderlist for the fucking
        branch, get the damn dates, save them as a fucking array. put it on the next page as
        as 2 choises. where we just put the damn dates inbetween. have a fnction that dose a
        bigest smallest evaluation and then send it to get the orders from the database. im kinda sick of this shit now.
        */
    }else{
        fetch.getTheOrders(selectedId, res, createDateArray2);
        //the other one.
    }
});
//POST function used by form in sales_report.ejs
// is not yet done as it still is a copy of another POST function.
app.post('/location_report',urlencodedParser, function(req, res) {
    console.log("app.js, post, employee");
    addToOrder(req.body);
    res.render('employee', {orders: getOrders(), branches:branches});
});
//POST function used by form in cashier.ejs,
//this function is used to remove an item from orders and
//rerender the page with the new order item list.
app.post('/removeMe',urlencodedParser, function(req, res) {
    delete orders.orders[req.body.itemNr];
    res.render('cashier', {cashier: orders.cashier, orders: getOrders()});
});
//POST function, not in use anymore?
app.post('/employee',urlencodedParser, function(req, res) {
    console.log("app.js, post, employee");
    addToOrder(req.body);
    res.render('employee', {orders: getOrders(), branches:branches});
});
//POST function to clear orders, is not yet complete as it need some tweeks
//in the content it renders.
app.post('/clear',urlencodedParser, function(req, res) {
    console.log("app.js, post, clear");
    clearOrder();
    res.render('cashier', getOrders());
});
//POST function to send the complete order to DB,
//needs to be constructed.
app.post('/send',urlencodedParser, function(req, res) {
    console.log("app.js, post, send");
    fetch.getProductsInStock(getOrders(), res, callBackNewRenameLater, insertDB, callBackNew2RenameLater, callBackNew3RenameLater);
});

//POST function used by form in employee.ejs to chose witch branch to use
//in the order.
app.post('/branch',urlencodedParser, function(req, res) {
    console.log("app.js, post, branch");
    branch = req.body.branch;
    fetch.getBranchID(branch, res, getEmployees);
});
app.post('/branchEmployer',urlencodedParser, function(req, res) {
    console.log("app.js, post, branchEmployer");
    branch = req.body.branch;
    fetch.getBranchID(branch, res, getEmployeesEmployer);
});
//POST function used by form in employeeChoice.ejs to chose witch employeeChoice
//to use in the order.
app.post('/cashier',urlencodedParser, function(req, res) {
    console.log("app.js, post, cashier, chosen cashier:\n"+req.body.cashier);
    orders.cashier = req.body.cashier;
    res.render('cashier', {cashier: orders.cashier, orders: getOrders()});
});
app.post('/boss',urlencodedParser, function(req, res) {
    console.log("app.js, post, boss, chosen Boss:\n"+req.body.boss);
    comment = {boss:req.body.boss, cashier:req.body.cashier, comment:req.body.comment};
    console.log(comment);
    //comment = {boss:"", cashier:"", comment:"", branch:""};
    insertDB.createComment(comment.cashier,comment.boss,comment.comment,res);
});
//POST function to used in the example profile.ejs.
app.get('/profile/:name', function(req, res) {
    var data = {hobbies: ['eating','fighting','and so on']}
    res.render('profile',{person:req.params.name, data: data});
});
//GET function used to populate the choise of branch in employee.ejs,
//and render the employee.ejs.
app.get('/employee', function(req, res) {
    console.log("app.js, get, employee");
    branches = {branches:[], choise:[]};
    fetch.getAdresses(getBranches, res);
});
//GET function used to render employer.ejs.
app.get('/employer', function(req, res) {
    console.log("app.js, get, employer");
    branches = {branches:[], choise:[]};
    fetch.getAdresses(getBranchesEmployer, res);
});
function getBranchesEmployer(ob, res){
    branches = {branches:[], choise:[]};
    for (var i = 0; i < ob.length; i++) {
        branches.branches.push(ob[i].Address.Street);
    }
    res.render('employer', {branches:branches});
}
//GET Employee list with all info about an employee.
app.get('/employer-employee-list', function(req, res) {
    console.log("app.js, get, employer-employee-list");
    fetch.getCompleteEmployeeList(res,function (ob,resp){

            resp.render('employer-employee-list',{employees:ob} );
        });
});

//GET function to render home.ejs.
app.get('/home', function(req, res) {
    console.log("app.js, get, home");
    res.render('home');
});
//GET function to render home.ejs. incase you go to localhost:3000 when running the server.
app.get('/', function(req, res) {
    console.log("app.js, get, /");
    res.render('home');
});
//GET function that fetches branches from db, populates
//locationmanager.ejs and renders it.
app.get('/locationmanager', function(req, res) {
    console.log("app.js, get, locationmanager");
    fetch.getBranchName(res);
});
//GET function that renders membersclub.ejs.
app.get('/memberclub', function(req, res) {
    console.log("app.js, get, memberclub");
    res.render('memberclub');
});
//GET function used for testing.
app.get('/test', function(req, res) {
    console.log("app.js, get, test");
    fetch.getProductsInStock("56", res, testStorage);
});
//POST function used for testing.
app.post('/test',urlencodedParser, function(req, res) {
    console.log("app.js, post, test");
    addToOrder(req.body);
    res.render('employeeChoice', {orders: getOrders(), branches:branches});
});
//POST function used by the forms in cashier to add items to the orders object
//and rerender the cashier.ejs with the new objects.
app.post('/addToOrder',urlencodedParser, function(req, res) {
    console.log("app.js, post, addToOrder");
    addToOrder(req.body, res);
});
//POST function for the registration of a new member.
app.post('/newMember',urlencodedParser, function(req, res) {
    console.log("app.js, post, newMember");
    console.log(req.body);
    insertDB.insertMember(req.body, res, anotherCallBack);
});
app.post('/sales_during_time_report',urlencodedParser, function(req, res) {
    console.log("app.js, post, newMember");
    console.log(req.body.firstDate);
    console.log(req.body.secondDate);
    console.log(req.body.id);
    if(req.body.firstDate>req.body.secondDate){
        fetch.getTheOrders2(req.body.id, req.body.secondDate, req.body.firstDate, res, callbackMakeListOfStuffs);
    }else if (req.body.secondDate>req.body.firstDate) {
        fetch.getTheOrders2(req.body.id, req.body.firstDate, req.body.secondDate, res, callbackMakeListOfStuffs);
    }else{
        fetch.getTheOrders2(req.body.id, req.body.firstDate, req.body.secondDate, res, callbackMakeListOfStuffs);
    }

});
app.post('/sales_during_time_report_individual',urlencodedParser, function(req, res) {
    console.log("app.js, post, newMember");
    console.log(req.body.firstDate);
    console.log(req.body.secondDate);
    console.log(req.body.id);
    console.log(req.body.name);

    if(req.body.firstDate>req.body.secondDate){
        fetch.getTheOrders2(req.body.id, req.body.secondDate, req.body.firstDate, res, callbackMakeListOfStuffs, req.body.name);
    }else if (req.body.secondDate>req.body.firstDate) {
        fetch.getTheOrders2(req.body.id, req.body.firstDate, req.body.secondDate, res, callbackMakeListOfStuffs, req.body.name);
    }else{
        fetch.getTheOrders2(req.body.id, req.body.firstDate, req.body.secondDate, res, callbackMakeListOfStuffs, req.body.name);
    }

});

app.listen(3000);

//function that returns the DB connection string.
function getDB(){
    return 'mongodb://bobbytables:mightygoodpwd@212.85.88.103:27017/schoolProject';
}
//function to set the branch id, is no longer in use?
function setBranchID(ob){
    orders.branchID = ob;
}
//function that is used as a callback to populate the choise of branch in
//employee.ejs and then renders said .ejs.
function getBranches(ob, res){
    branches = {branches:[], choise:[]};
    for (var i = 0; i < ob.length; i++) {
        branches.branches.push(ob[i].Address.Street);
    }
    res.render('employee', {orders: getOrders(), branches:branches});
}
function getBranchesEmployer(ob, res){
    branches = {branches:[], choise:[]};
    for (var i = 0; i < ob.length; i++) {
        branches.branches.push(ob[i].Address.Street);
    }
    res.render('employer', {branches:branches});
}
/*
function that is used as a callback to fetch the id of the branch chosen,
takes the ob (object) parameter witch is the result object from the database in fetch.js,
and the res (response to a /POST or /GET request that is then used to render .ejs files on).
it picks out the branch ID from the object and puts it in the orders object under the key "branch".
and then calls getEmployees in fetch.js, it send the ID of branch we want the employees from, the res that is used to render .ejs
files to and another callback function.
*/
function getEmployees(ob, res) {

    for (var i = 0; i < ob.length; i++) {
        console.log("app.js, loop in getEmployees, ID of the object being loopt trough:\n"+ ob[i].ID);
        orders.branch = ob[i].ID;
        fetch.getEmployee(ob[i].ID, res, makeEmployeeList);
    }
}
//callback function that takes a respons object (ob), and the res that we render the employeeChoice.ejs to.
//the function gets the employees firstname and adds them to a array in a list object.
//then renders the employeeChoice.ejs with the object.
// side note: i think the orders object that is passed along is not in use anymore.
function makeEmployeeList(ob, res) {
    var list = {employees: []};
    for (var i = 0; i < ob.length; i++) {
        list.employees.push(ob[i].firstname);
    }
    res.render('employeeChoice', {orders: getOrders(), employees:list});
}
function getEmployeesEmployer(ob, res) {

    for (var i = 0; i < ob.length; i++) {
        console.log("app.js, loop in getEmployeesEmployer, ID of the object being loopt trough:\n"+ ob[i].ID);
        orders.branch = ob[i].ID;
        fetch.getEmployer(ob[i].ID, res, makeEmployeeListEmployer);
    }
}
function makeEmployeeListEmployer(ob, res) {
    var list = {employees: []};
    var list2 = {cashiers: []};
    for (var i = 0; i < ob.length; i++) {
        if(ob[i].Role==="Boss"){
            list.employees.push({firstname: ob[i].firstname ,id: ob[i].employeeID});
        }else{
            list2.cashiers.push({firstname: ob[i].firstname,id: ob[i].employeeID});
        }
    }
    res.render('employerChoise', {employees:list, cashiers:list2});
}
function callBackNewRenameLater(DBres, res, insDB, CBackOrders, cBN2RL, cBN3RL){
    console.log(DBres);
    console.log(CBackOrders);

    for (x in CBackOrders.orders){
        console.log(CBackOrders.orders[x].name);
        for (y in DBres){
            if (CBackOrders.orders[x].name === DBres[y].ProductName){
                console.log(DBres[y].ProductName);

                if((DBres[y].Quantity-CBackOrders.orders[x].amount)<0){
                    //there is not enough in the inventory send error message with
                    //products and amout of products left.
                }else{
                    DBres[y].Quantity = DBres[y].Quantity-CBackOrders.orders[x].amount;
                }
            }
        }
    }
    insDB.updateStock(CBackOrders, DBres, res, cBN2RL, cBN3RL, insDB);
    clearOrder();

}
function callBackNew2RenameLater(res, res2, ord, cBN3RL, insDB){
    console.log(res2.result);
    insDB.insertOrder(res, ord, cBN3RL)
    res.render('cashier', {cashier: ord.cashier, branch:ord.branch, orders: getOrders()});
}
function callBackNew3RenameLater(res, res2, ord){
    console.log(res2.result);
    res.render('cashier', {cashier: ord.cashier, branch:ord.branch, orders: getOrders()});
}
function anotherCallBack(res, res2, boo, n) {
    if(boo===false){
        res.render('succes', {name: n });
    }else{
        res.render('error');
    }
    console.log(res2.result);
}
function testStorage(result, res){
    var theResult = result[0];
    for (var i = 0; i < theResult.ProductsInStock.length; i++) {
        console.log(theResult.ProductsInStock[i].ProductName);
    }
    res.send(theResult);
}
function createDateArray(x, res, id){
    var dateArray = [];
    var month = x.Order[0].OrderDate.getMonth()+1;
    var fdate = x.Order[0].OrderDate.getFullYear()+"-"+month+"-"+x.Order[0].OrderDate.getDate();
    dateArray.push(fdate);
    for(i in x.Order){
        var month = x.Order[i].OrderDate.getMonth()+1;
        if(fdate===x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate()){
        }else{
            dateArray.push(x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate());
            fdate=x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate();
        }
    }
    res.render('sales_during_time', {dates:dateArray,  id:id});
}
function createDateArray2(x, res, id){
    var dateArray = [];
    var month = x.Order[0].OrderDate.getMonth()+1;
    var fdate = x.Order[0].OrderDate.getFullYear()+"-"+month+"-"+x.Order[0].OrderDate.getDate();
    dateArray.push(fdate);
    for(i in x.Order){
        var month = x.Order[i].OrderDate.getMonth()+1;
        if(fdate===x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate()){
        }else{
            dateArray.push(x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate());
            fdate=x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate();
        }
    }
    fetch.getEmployee2(id, dateArray, res, thecallbackfunctionyetcreated);
    //res.render('sales_during_time', {dates:dateArray,  id:id});
}
function thecallbackfunctionyetcreated(result, res, id, dateArray) {
    nameArray = [];
    for(i in result){
        nameArray.push(result[i].firstname);
    }
    res.render('sales_during_time_individual', {dates:dateArray,  id:id, name:nameArray})
}
function callbackMakeListOfStuffs(x, start, end, res, name){
    var totalSale = [{name:"Whole-Bean Coffee", amount:0}, {name:"Espresso Roast", amount:0}, {name:"Whole Bean French", amount:0},
    {name:"Whole Bean Light Roast", amount:0}, {name:"Brewed Coffee", amount:0}, {name:"Espresso", amount:0}, {name:"Latte", amount:0},
    {name:"Capuccino", amount:0}, {name:"Hot Chocolate", amount:0}, {name:"Skim Milk", amount:0}, {name:"Soy Milk", amount:0}, {name:"Whole Milk", amount:0},
    {name:"2% Milk", amount:0}, {name:"Whipped Cream", amount:0}, {name:"Vanilla Syrup", amount:0}, {name:"Caramel Syrup", amount:0}, {name:"Irish Cream Syrup", amount:0}];
    if (name === undefined || name === null) {
        for(i in x.Order){
            var month = x.Order[i].OrderDate.getMonth()+1;
            var date = x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[0].OrderDate.getDate();
            if((date>=start)&&(date<=end)){
                for(j in x.Order[i].orderList){
                    for(ii in totalSale){
                        if(totalSale[ii].name===x.Order[i].orderList[j].name){
                            totalSale[ii].amount=totalSale[ii].amount+parseInt(x.Order[i].orderList[j].amount);
                        }
                    }
                }
            }
        }
        res.render("sales_during_time_report", {total:totalSale});
    }else{
        for(i in x.Order){
            var month = x.Order[i].OrderDate.getMonth()+1;
            var date = x.Order[i].OrderDate.getFullYear()+"-"+month+"-"+x.Order[i].OrderDate.getDate();
            if((date>=start)&&(date<=end)&&(name===x.Order[i].cashier)){
                for(j in x.Order[i].orderList){
                    for(ii in totalSale){
                        if(totalSale[ii].name===x.Order[i].orderList[j].name){
                            totalSale[ii].amount=totalSale[ii].amount+parseInt(x.Order[i].orderList[j].amount);
                        }
                    }
                }
            }
        }
        res.render("sales_during_time_report_individual", {total:totalSale, name});
    }
}
