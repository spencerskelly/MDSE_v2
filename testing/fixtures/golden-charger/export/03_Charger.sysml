package ChargerProduct {
    part def Contactor;

    part def Charger {
        part controller : ControllerLibrary::Controller;
        part modules : PowerLibrary::PowerModule[3];
        part contactors : Contactor[2];
    }
}
