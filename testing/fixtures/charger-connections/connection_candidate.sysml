package ConnController {
    port def CanPort;
    part def Controller {
        port can : CanPort;
    }
}
package ConnPower {
    part def Module {
        port can : ConnController::CanPort;
    }
}
package ConnProduct {
    part def Charger {
        part controller : ConnController::Controller;
        part module : ConnPower::Module;
        connect controller.can to module.can;
    }
}
