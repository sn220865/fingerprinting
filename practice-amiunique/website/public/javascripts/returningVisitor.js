$(document).ready(function() {
    if(readCookie('returningvis') == null && readCookie('localhost:9000') != null && readCookie("tempReturningVis")==null){
        createCookie('returningvis', 1, 2);
        $('#returningvis').trigger('click');
    }
});