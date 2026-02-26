// routes/public/OrderStatus.ts

import { Router } from "express";
import * as ctrl from "../../controllers/public/ordersController";

const router = Router();

router.post("/", ctrl.create);

export default router;