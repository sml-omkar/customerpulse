import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { AppError } from "../middleware/errorHandler";

// Client/project names used to be stored fully upper-cased. That's now
// just the first letter capitalized (rest lower-cased) - e.g. "Aditya"
// instead of "ADITYA". Existence checks stay case-insensitive so we don't
// end up with both "Aditya" and "ADITYA" as separate clients.
function toSentenceCase(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export const clientController = {

    async getClients(req: AuthedRequest, res: Response) {
        try {
            const clients = await prisma.client.findMany({
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    projects: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });

            return res.status(200).json({
                success: true,
                count: clients.length,
                data: clients,
            });
        } catch (error) {
            console.error("Get Clients Error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }


    },

    async createClient(req: AuthedRequest, res: Response) {
        try {
            const { name, isKeyClient, isWindClient, projects } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Client name is required",
                });
            }

            // check if the client already exists or not (case-insensitive,
            // since we no longer store names fully upper-cased)

            const existCheck = await prisma.client.findFirst({
                where: {
                    name: { equals: name.trim(), mode: "insensitive" }
                }
            })

            if (existCheck) {
                throw new AppError("The client already eixts", 401);
            }

            // NOTE(added): projects can optionally be created alongside the
            // client — each with its own isShutdownJob flag. `projects` is
            // expected as an array of { name, isShutdownJob? }.
            const projectNames: { name: string; isShutdownJob?: boolean }[] = Array.isArray(projects)
                ? projects.filter((p: any) => p?.name && String(p.name).trim())
                : [];

            const client = await prisma.client.create({
                data: {
                    name: toSentenceCase(name),
                    isKeyClient: Boolean(isKeyClient),
                    isWindClient: Boolean(isWindClient),
                    projects: {
                        create: projectNames.map((p) => ({
                            name: toSentenceCase(p.name),
                            isShutdownJob: Boolean(p.isShutdownJob),
                        })),
                    },
                },
                include: { projects: true },
            });

            return res.status(201).json({
                success: true,
                message: "Client created successfully",
                data: client,
            });

        } catch (error) {
            console.error("Create Client Error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },

    async updateClient(req: AuthedRequest, res: Response) {
        try {
            const { id } = req.params;
            const { name, isKeyClient, isWindClient } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Client name is required",
                });
            }

            const existingClient = await prisma.client.findUnique({
                where: { id },
            });

            if (!existingClient) {
                throw new AppError("The client already eixts", 401);
            }

            const updatedClient = await prisma.client.update({
                where: { id },
                data: {
                    name: toSentenceCase(name),
                    ...(isKeyClient !== undefined ? { isKeyClient: Boolean(isKeyClient) } : {}),
                    ...(isWindClient !== undefined ? { isWindClient: Boolean(isWindClient) } : {}),
                },
                include: { projects: true },
            });

            return res.status(200).json({
                success: true,
                message: "Client updated successfully",
                data: updatedClient,
            });
        } catch (error) {
            console.error("Update Client Error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },

    async deleteClient(req: AuthedRequest, res: Response) {
        try {
            const { id } = req.params;

            const existingClient = await prisma.client.findUnique({
                where: { id },
            });

            if (!existingClient) {
                throw new AppError("The client doenst eixts", 401);
            }

            await prisma.client.delete({
                where: { id },
            });

            return res.status(200).json({
                success: true,
                message: "Client deleted successfully",
            });
        } catch (error) {
            console.error("Delete Client Error:", error);

            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }

    },

    async importClients(req: AuthedRequest, res: Response) {
        try {
            const { clients } = req.body;

            if (!Array.isArray(clients) || clients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No clients data provided",
                });
            }

            const results = {
                created: 0,
                clientsSkipped: 0,
                projectsAdded: 0,
                projectsSkipped: 0,
                errors: [] as string[],
            };

            for (const row of clients) {
                const clientName = toSentenceCase(String(row.clientName || ""));
                if (!clientName) {
                    results.errors.push("Skipped row with empty client name");
                    continue;
                }

                const wc = String(row.windClient ?? "").trim().toLowerCase();
                const isWindClient = wc === "yes" || wc === "true" || wc === "y" || wc === "1";
                const kc = String(row.keyClient ?? "").trim().toLowerCase();
                const isKeyClient = kc === "yes" || kc === "true" || kc === "y" || kc === "1";

                const projectEntries: { name: string; isShutdownJob: boolean }[] = [];
                if (row.projects && typeof row.projects === "string") {
                    const parts = row.projects.split(",").map((p: string) => p.trim()).filter(Boolean);
                    for (const part of parts) {
                        const eqIndex = part.lastIndexOf("=");
                        if (eqIndex > 0) {
                            const pName = toSentenceCase(part.substring(0, eqIndex));
                            const pFlag = part.substring(eqIndex + 1).trim().toLowerCase();
                            if (pName) {
                                projectEntries.push({
                                    name: pName,
                                    isShutdownJob: pFlag === "yes" || pFlag === "true" || pFlag === "y" || pFlag === "1",
                                });
                            }
                        } else {
                            projectEntries.push({ name: toSentenceCase(part), isShutdownJob: false });
                        }
                    }
                }

                const existingClient = await prisma.client.findFirst({
                    where: { name: { equals: clientName, mode: "insensitive" } },
                    include: { projects: true },
                });

                if (existingClient) {
                    results.clientsSkipped++;
                    for (const pe of projectEntries) {
                        const existingProject = existingClient.projects.find(
                            (p) => p.name.toLowerCase() === pe.name.toLowerCase()
                        );
                        if (existingProject) {
                            results.projectsSkipped++;
                        } else {
                            await prisma.project.create({
                                data: {
                                    name: pe.name,
                                    isShutdownJob: pe.isShutdownJob,
                                    clientId: existingClient.id,
                                },
                            });
                            results.projectsAdded++;
                        }
                    }
                } else {
                    await prisma.client.create({
                        data: {
                            name: clientName,
                            isWindClient,
                            isKeyClient,
                            projects: {
                                create: projectEntries,
                            },
                        },
                    });
                    results.created++;
                }
            }

            return res.status(200).json({
                success: true,
                message: "Import completed",
                data: results,
            });
        } catch (error) {
            console.error("Import Clients Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    },

}
