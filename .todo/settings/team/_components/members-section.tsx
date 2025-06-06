'use client';

import { useUser } from '@clerk/nextjs/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@unhook/ui/alert-dialog';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { Input } from '@unhook/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { toast } from '@unhook/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { format, fromUnixTime } from 'date-fns';
import { ArrowUpDown, MoreHorizontal, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  getOrgMembersAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from '../actions';
import type { Member, Role } from '../types';
import { InviteMemberDialog } from './invite-member-dialog';

export function MembersSection() {
  const params = useParams<{ orgId: string }>();
  const { user } = useUser();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getOrgMembersAction({
        orgId: params.orgId,
      });

      if (!result) {
        throw new Error('Failed to fetch members');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      if (!result.data) {
        throw new Error('No data returned from server');
      }

      setMembers(result.data.data ?? []);
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to fetch members',
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteMember = async (email: string, role: Role) => {
    try {
      setIsLoading(true);
      const result = await inviteMemberAction({
        email,
        role,
        orgId: params.orgId,
      });

      if (!result) {
        throw new Error('Failed to invite member');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Invitation sent', {
        description: `Invitation sent to ${email}`,
      });
      setIsInviteDialogOpen(false);
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to invite member',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: Role) => {
    try {
      setIsLoading(true);
      const result = await updateMemberRoleAction({
        userId,
        role,
        orgId: params.orgId,
      });

      if (!result) {
        throw new Error('Failed to update role');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Role updated', {
        description: 'Member role updated successfully',
      });
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMemberId) return;

    try {
      setIsLoading(true);
      const result = await removeMemberAction({
        userId: selectedMemberId,
        orgId: params.orgId,
      });

      if (!result) {
        throw new Error('Failed to remove member');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Member removed', {
        description: 'Member removed successfully',
      });
      setIsAlertOpen(false);
      setSelectedMemberId(null);
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to remove member',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      accessorFn: (row) =>
        `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        const rowValue = row.getValue(columnId);
        if (typeof rowValue === 'string') {
          return rowValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        return false;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Email
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Role
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Joined
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) =>
        format(fromUnixTime(row.original.joinedAt), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.userId === user?.userId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUpdateRole(member.userId, 'Admin')}
                disabled={isCurrentUser || member.role === 'Admin'}
              >
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateRole(member.userId, 'Member')}
                disabled={isCurrentUser || member.role === 'Member'}
              >
                Make Member
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedMemberId(member.userId);
                  setIsAlertOpen(true);
                }}
                disabled={isCurrentUser}
              >
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Manage your team members and their roles. Admins have full access to
        manage the organization, while Members have limited permissions.
      </p>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose
              access to all resources in this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMemberId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90 text-primary"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center gap-2 py-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsInviteDialogOpen(true)}
        >
          <Plus className="size-4" />
          Invite Member
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout" initial={false}>
              {table.getRowModel().rows?.length ? (
                [
                  ...table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  )),
                  isLoading && (
                    <motion.tr
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <TableCell
                        colSpan={columns.length}
                        className="h-12 text-center border-t"
                      >
                        <div className="flex items-center justify-center">
                          <Icons.Spinner className="size-4 animate-spin" />
                        </div>
                      </TableCell>
                    </motion.tr>
                  ),
                ].filter(Boolean)
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Icons.Spinner className="size-6 animate-spin" />
                      </div>
                    ) : (
                      'No results.'
                    )}
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(members.length / pageSize) - 1}
          >
            Next
          </Button>
        </div>
      </div>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInviteMember}
        isLoading={isLoading}
      />
    </div>
  );
}
