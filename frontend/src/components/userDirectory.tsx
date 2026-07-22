import { useState } from "react";
import { User as UserType, Department } from "../types";
import { EditUserModal } from "./EditUserModal";

export const UserDirectory = (
    {token,setError,setSuccess,fetchUsers,users,departments} : {
        user:UserType,
        setUser: React.Dispatch<React.SetStateAction<UserType | null>>
        token: string,
        setSuccess:  React.Dispatch<React.SetStateAction<string>>,
        fetchUsers : () => Promise<void>,
        users : UserType[],
        departments: Department[],
        setError : React.Dispatch<React.SetStateAction<string>>
    }
) => {
    // NOTE(added): a single consolidated "Edit user" modal - a GLOBAL_ADMIN
    // can change absolutely anything PATCH /users/:id accepts (role, the
    // department they head as HOD/CXO, agent department transfer, category
    // routing, Wind Category, Zone, support tier, active status, assignment
    // availability, and max active ticket capacity) for any staff member,
    // from one place. See EditUserModal.tsx.
    const [editingUser, setEditingUser] = useState<UserType | null>(null);

    const handleSaved = async (message: string) => {
        setSuccess(message);
        await fetchUsers();
    };

    return (
        <div className="space-y-6 font-sans">
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Directory</h1>
                <p className="text-sm text-slate-500 mt-1">Staff registry - role profiles and routing caps.</p>
              </div>

              <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">User</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Email Address</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Role Profile</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Support Tier</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Active Status</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Assignment State</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Load count</th>
                        <th className="px-6 py-3.5 text-left whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {users.map(u => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap max-w-[200px] truncate">{u.fullName}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap max-w-[220px] truncate">{u.email}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">{u.role}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">{u.supportLevel || "--"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] border ${
                              u.isActive 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              {u.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                            {u.isAvailableForAssignment ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                                Available
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Not Available</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                            {u._count.ticketsAssigned || 0} / {u.maxActiveTickets || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              Edit user
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingUser && (
                <EditUserModal
                  targetUser={editingUser}
                  departments={departments}
                  token={token}
                  onClose={() => setEditingUser(null)}
                  onSaved={handleSaved}
                  setError={setError}
                />
              )}
            </div>
    )
}
