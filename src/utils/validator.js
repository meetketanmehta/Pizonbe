export function checkIfPermitted(userType, permittedUserTypes) {
    let permitted = false;
    permittedUserTypes.forEach((permittedUserType) => {
        if(permittedUserType === userType){
            permitted = true;
        }
    });
    return permitted;
}