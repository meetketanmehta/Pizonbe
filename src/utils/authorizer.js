export function checkIfIncludes(user, userTypes) {
    var included = false;
    for(var index in userTypes) {
        if(user.userType === userTypes[index])
            included = true;
    }
    return included;
}