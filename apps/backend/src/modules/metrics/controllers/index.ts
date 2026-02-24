import { metricsService } from "../services";
import { MetricsController } from "./MetricsController";

export const metricsController = new MetricsController({ metricsService });
