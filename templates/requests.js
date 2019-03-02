
let current_semester;

class Section{
    constructor(section, instructor, days, room, enrollment, enrollmentLimit, waitlist){
        this.section = section;
        this.instructor = instructor;
        this.days = days;
        this.room = room;
        this.enrollment = enrollment;
        this.enrollmentLimit = enrollmentLimit;
        this.waitlist = waitlist;
    }
};

class Course{
    constructor(department, number, title, sections){
        this.department = department;
        this.number = number;
        this.title = title;
        this.sections = sections;
    }
};

class Schedule{
    constructor(sections){
        this.sections = sections;
    }
};

function get_semester(){
    $.post(
        "/api/semesters/",
        {

        },
        function (data) {
            for(sems in data){
                $("semester").append('<a class="dropdown-item" id="' + sems + '" onClick="change_semester(' + sems + ')">' + data[sems]["name"] + '</a>');
            }
        },
        "json",
    );
}

function add_class(){
    let dept = document.getElementById("dept");
    let num = document.getElementById("num");
    let title = document.getElementById("num");
    let earliest = document.getElementById("earliest");
    let latest = document.getElementById("latest");

    if(dept.innerHTML === "" || num.innerHTML === ""){
        alert("Please enter course information or search a class.");
        return;
    }

}

function get_schedule(){
    $.post(
        "/api/classes/",
        {

        },
        function(returned){
            const attr_map = returned.meta["attr_map"];
            const data = returned.data;
            for(const schedule of data){
                for(const course of schedule){
                    const department = schedule[0];
                    const number = schedule[1];
                    const section = schedule[2];
                    const days = schedule[6];
                    const room = schedule[7];

                }
            }
        },
        "json"
    )
}

function change_semester(sems){
    document.getElementById("semester").innerHTML = document.getElementById(sems).innerHTML;
    current_semester = sems;
    $.post(
        "/api/??",
        {
            semester: document.getElementById(sems).innerHTML,
        },
        function(data){
            
        },
        "json"
    )
}


