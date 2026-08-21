import { DirectAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";

type StorageAggregateComponent = ConstructorParameters<typeof DirectAggregate>[0];
const component = (components as Record<"relayStorageUsage", StorageAggregateComponent>).relayStorageUsage;

export const relayStorageUsage = new DirectAggregate<{ Namespace: string; Key: string; Id: string }>(component);
